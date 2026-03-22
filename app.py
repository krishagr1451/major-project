from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import math
from datetime import datetime
import time

from supabase import create_client
from dotenv import load_dotenv
import httpx
try:
    import yfinance as yf
except Exception:
    yf = None

from backtesting import Backtest, Strategy
from backtesting.lib import crossover
from backtesting.test import SMA

app = Flask(__name__)
CORS(app)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
TWELVEDATA_API_KEY = os.getenv("TWELVEDATA_API_KEY", "")

supabase_admin = None
supabase_anon = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    supabase_anon = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FOLDERS = [
    os.path.join(BASE_DIR, "Backtest", "data"),
    os.path.join(BASE_DIR, "data"),
]

# Primary upload location (kept compatible with existing flow)
UPLOAD_FOLDER = CSV_FOLDERS[0]
for folder in CSV_FOLDERS:
    os.makedirs(folder, exist_ok=True)

TWELVEDATA_BASE_URL = "https://api.twelvedata.com"
market_cache = {}

MARKET_CACHE_TTL = {
    "quote": 3,
    "candles": 60,
    "profile": 86400,
}

APP_STARTED_AT = time.time()
METRICS = {
    "requests_total": 0,
    "market_quote_requests": 0,
    "market_candles_requests": 0,
    "market_search_requests": 0,
    "market_provider_twelvedata_success": 0,
    "market_provider_twelvedata_errors": 0,
    "market_provider_yfinance_success": 0,
    "market_provider_yfinance_errors": 0,
    "market_fallbacks": 0,
    "backtest_runs": 0,
    "backtest_failures": 0,
    "http_4xx": 0,
    "http_5xx": 0,
}


def metric_inc(key, amount=1):
    METRICS[key] = int(METRICS.get(key, 0)) + int(amount)


@app.before_request
def before_request_metrics():
    metric_inc("requests_total")


@app.after_request
def after_request_metrics(response):
    status = int(getattr(response, "status_code", 0) or 0)
    if 400 <= status < 500:
        metric_inc("http_4xx")
    elif status >= 500:
        metric_inc("http_5xx")
    return response


def supabase_ready():
    return supabase_admin is not None and supabase_anon is not None


def get_bearer_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def get_current_user():
    if not supabase_ready():
        return None, (jsonify({"success": False, "error": "Supabase is not configured"}), 500)

    token = get_bearer_token()
    if not token:
        return None, (jsonify({"success": False, "error": "Missing access token"}), 401)

    try:
        user_response = supabase_admin.auth.get_user(token)
        user = getattr(user_response, "user", None)
        if not user:
            return None, (jsonify({"success": False, "error": "Invalid token"}), 401)
        return user, None
    except Exception:
        return None, (jsonify({"success": False, "error": "Invalid token"}), 401)


def get_user_id(user):
    if isinstance(user, dict):
        return user.get("id")
    return getattr(user, "id", None)


def get_auth_supabase_client(token):
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    return client


def auth_exception_to_response(e):
    message = str(e or "")
    lowered = message.lower()

    connectivity_signatures = [
        "connecterror",
        "connectionreseterror",
        "forcibly closed",
        "connection aborted",
        "connection reset",
        "timed out",
        "timeout",
        "name resolution",
        "temporary failure",
        "network is unreachable",
        "ssl",
    ]

    if any(sig in lowered for sig in connectivity_signatures):
        return jsonify({
            "success": False,
            "error": "Cannot reach Supabase Auth service. Check internet/firewall/VPN/proxy and try again.",
            "details": message,
        }), 503

    if "invalid login credentials" in lowered or "invalid credentials" in lowered:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    return jsonify({"success": False, "error": message or "Auth request failed"}), 400


def write_profile_if_missing(user_id, name=None):
    profile_payload = {
        "user_id": user_id,
        "full_name": name,
        "updated_at": datetime.utcnow().isoformat(),
    }
    supabase_admin.table("profiles").upsert(profile_payload).execute()


def row_to_dict(row):
    return row if isinstance(row, dict) else dict(row)


def serialize_user(user):
    if user is None:
        return None
    if isinstance(user, dict):
        return user
    if hasattr(user, "model_dump"):
        return user.model_dump()
    if hasattr(user, "dict"):
        return user.dict()
    return {"id": getattr(user, "id", None), "email": getattr(user, "email", None)}


def normalize_market_symbol(symbol, exchange=None):
    value = (symbol or "").upper().strip()
    if not value:
        return value

    if "." in value:
        return value

    exch = (exchange or "nse").lower().strip()
    if exch == "bse":
        return f"{value}.BO"
    if exch == "nse":
        return f"{value}.NS"
    return value


def infer_exchange(symbol, requested_exchange=None):
    requested = (requested_exchange or "auto").lower().strip()
    if requested and requested != "auto":
        return requested

    value = (symbol or "").upper().strip()
    if value.endswith(".NS") or value.endswith(":NSE"):
        return "nse"
    if value.endswith(".BO") or value.endswith(":BSE"):
        return "bse"
    return "us"


def exchange_candidates(symbol, requested_exchange=None):
    requested = (requested_exchange or "auto").lower().strip()
    if requested and requested != "auto":
        return [requested]

    value = (symbol or "").upper().strip()
    if value.endswith(".NS") or value.endswith(":NSE"):
        return ["nse", "bse", "us"]
    if value.endswith(".BO") or value.endswith(":BSE"):
        return ["bse", "nse", "us"]
    return ["us", "nse", "bse"]


def symbol_filename_candidates(symbol):
    value = (symbol or "").upper().strip()
    if not value:
        return []

    values = [value]
    if ":" in value:
        values.append(value.split(":", 1)[0])
    if value.endswith(".NS") or value.endswith(".BO"):
        values.append(value[:-3])

    dedup = []
    for item in values:
        cleaned = item.strip()
        if cleaned and cleaned not in dedup:
            dedup.append(cleaned)
    return dedup


def parse_unix_timestamp(value, fallback):
    if value is None:
        return fallback
    try:
        return int(value)
    except Exception:
        return fallback


def to_twelvedata_symbol(symbol, exchange=None):
    value = (symbol or "").upper().strip()
    if not value:
        return value

    if ":" in value:
        return value

    if value.endswith(".NS"):
        return f"{value[:-3]}:NSE"
    if value.endswith(".BO"):
        return f"{value[:-3]}:BSE"

    exch = (exchange or "us").upper().strip()
    if exch == "BSE":
        return f"{value}:BSE"
    if exch == "NSE":
        return f"{value}:NSE"
    return value


def to_client_symbol(symbol, exchange=None):
    value = (symbol or "").upper().strip()
    exch = (exchange or "").upper().strip()

    if value.endswith(".NS") or value.endswith(".BO"):
        return value

    if ":" in value:
        base, ex = value.split(":", 1)
        ex = ex.upper()
        if ex == "NSE":
            return f"{base}.NS"
        if ex == "BSE":
            return f"{base}.BO"
        return base

    if exch == "NSE":
        return f"{value}.NS"
    if exch == "BSE":
        return f"{value}.BO"
    return value


def to_yfinance_symbol(symbol, exchange=None):
    value = (symbol or "").upper().strip()
    exch = (exchange or "").upper().strip()

    if not value:
        return value

    if value.endswith(".NS") or value.endswith(".BO"):
        return value

    if ":" in value:
        base, ex = value.split(":", 1)
        ex = ex.upper()
        if ex == "NSE":
            return f"{base}.NS"
        if ex == "BSE":
            return f"{base}.BO"
        return base

    if exch == "NSE":
        return f"{value}.NS"
    if exch == "BSE":
        return f"{value}.BO"
    return value


def persist_ohlcv_to_csv(symbol, df):
    candidates = symbol_filename_candidates(symbol)
    if not candidates:
        return None

    base = candidates[-1]
    out = df.copy().reset_index()
    out.rename(columns={"index": "Date"}, inplace=True)
    if "Date" not in out.columns:
        first = out.columns[0]
        out.rename(columns={first: "Date"}, inplace=True)
    out["Date"] = pd.to_datetime(out["Date"]).dt.strftime("%Y-%m-%d")

    path = os.path.join(UPLOAD_FOLDER, f"{base}.csv")
    out.to_csv(path, index=False)
    return path


def twelvedata_call(endpoint, params, cache_ttl=15):
    if not TWELVEDATA_API_KEY:
        raise ValueError("TWELVEDATA_API_KEY is not configured")

    full_params = {**params, "apikey": TWELVEDATA_API_KEY}
    cache_key = f"twelvedata:{endpoint}:{str(sorted(full_params.items()))}"
    now = time.time()

    cached = market_cache.get(cache_key)
    if cached and now - cached["ts"] < cache_ttl:
        return cached["data"], True

    url = f"{TWELVEDATA_BASE_URL}/{endpoint}"
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url, params=full_params)

    if response.status_code == 429 and cached:
        metric_inc("market_fallbacks")
        return cached["data"], True

    if response.status_code >= 400:
        metric_inc("market_provider_twelvedata_errors")
        raise ValueError(f"Twelve Data error {response.status_code}: {response.text}")

    data = response.json()
    if isinstance(data, dict) and data.get("status") == "error":
        code = data.get("code")
        message = data.get("message")
        metric_inc("market_provider_twelvedata_errors")
        raise ValueError(f"Twelve Data error {code}: {message}")

    market_cache[cache_key] = {"ts": now, "data": data}
    metric_inc("market_provider_twelvedata_success")
    return data, False


def yfinance_quote(symbol, exchange=None):
    if yf is None:
        raise ValueError("yfinance is not installed")

    yf_symbol = to_yfinance_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_symbol)

    fast_info = getattr(ticker, "fast_info", None) or {}
    current = safe_float(fast_info.get("lastPrice"))
    previous = safe_float(fast_info.get("previousClose"))
    day_high = safe_float(fast_info.get("dayHigh"))
    day_low = safe_float(fast_info.get("dayLow"))
    day_open = safe_float(fast_info.get("open"))

    if current <= 0:
        hist = ticker.history(period="5d", interval="1d", auto_adjust=False)
        if hist is None or hist.empty:
            raise ValueError(f"No yfinance quote data for {yf_symbol}")

        closes = pd.to_numeric(hist.get("Close"), errors="coerce").dropna()
        if closes.empty:
            raise ValueError(f"No yfinance close data for {yf_symbol}")

        current = float(closes.iloc[-1])
        previous = float(closes.iloc[-2]) if len(closes) > 1 else current

        last_row = hist.iloc[-1]
        day_high = safe_float(last_row.get("High", current))
        day_low = safe_float(last_row.get("Low", current))
        day_open = safe_float(last_row.get("Open", previous))

    if previous <= 0:
        previous = current

    delta = current - previous
    delta_pct = (delta / previous * 100.0) if previous else 0.0

    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    exchange_name = str(info.get("exchange") or exchange or "").upper()
    client_symbol = to_client_symbol(yf_symbol, exchange_name)

    return {
        "symbol": client_symbol,
        "exchange": exchange_name,
        "quote": {
            "c": current,
            "d": delta,
            "dp": delta_pct,
            "h": day_high or current,
            "l": day_low or current,
            "o": day_open or previous,
            "pc": previous,
            "t": int(time.time()),
        },
        "profile": {
            "symbol": client_symbol,
            "name": info.get("shortName") or info.get("longName"),
            "exchange": exchange_name,
            "currency": info.get("currency"),
            "type": info.get("quoteType"),
        },
    }


def yfinance_profile_details(symbol, exchange=None):
    if yf is None:
        raise ValueError("yfinance is not installed")

    yf_symbol = to_yfinance_symbol(symbol, exchange)
    cache_key = f"yfinance:profile:{yf_symbol}"
    ttl = MARKET_CACHE_TTL.get("profile", 86400)
    now = time.time()

    cached = market_cache.get(cache_key)
    if cached and now - cached["ts"] < ttl:
        return cached["data"]

    ticker = yf.Ticker(yf_symbol)
    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    details = {
        "name": info.get("shortName") or info.get("longName"),
        "longName": info.get("longName"),
        "shortName": info.get("shortName"),
        "exchange": info.get("exchange"),
        "currency": info.get("currency"),
        "type": info.get("quoteType"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "country": info.get("country"),
        "website": info.get("website"),
        "employees": info.get("fullTimeEmployees"),
        "marketCap": info.get("marketCap"),
        "trailingPE": info.get("trailingPE"),
        "forwardPE": info.get("forwardPE"),
        "priceToBook": info.get("priceToBook"),
        "beta": info.get("beta"),
        "dividendYield": info.get("dividendYield"),
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
        "averageVolume": info.get("averageVolume"),
    }

    market_cache[cache_key] = {"ts": now, "data": details}
    return details


def enrich_profile(symbol, exchange, base_profile):
    profile = dict(base_profile or {})
    try:
        details = yfinance_profile_details(symbol, exchange)
        for key, value in details.items():
            if value is None or value == "":
                continue
            profile[key] = value
    except Exception:
        pass
    return profile


def yfinance_search_symbols(query, limit=20):
    if yf is None:
        raise ValueError("yfinance is not installed")

    value = (query or "").strip()
    if not value:
        return []

    rows = []
    seen = set()

    search_rows = []
    try:
        search_obj = yf.Search(value, max_results=limit)
        search_rows = getattr(search_obj, "quotes", None) or []
    except Exception:
        search_rows = []

    for item in search_rows:
        symbol = str(item.get("symbol") or "").upper().strip()
        if not symbol or symbol in seen:
            continue
        seen.add(symbol)
        rows.append({
            "symbol": symbol,
            "description": item.get("shortname") or item.get("longname") or symbol,
            "displaySymbol": symbol,
            "type": item.get("quoteType") or item.get("typeDisp") or "Equity",
            "exchange": item.get("exchange") or item.get("exchDisp"),
        })
        if len(rows) >= limit:
            return rows

    direct_candidates = [
        (value.upper(), "US"),
        (f"{value.upper()}.NS", "NSE"),
        (f"{value.upper()}.BO", "BSE"),
    ]

    for symbol, exchange in direct_candidates:
        if symbol in seen:
            continue
        seen.add(symbol)
        rows.append({
            "symbol": symbol,
            "description": symbol,
            "displaySymbol": symbol,
            "type": "Equity",
            "exchange": exchange,
        })
        if len(rows) >= limit:
            break

    return rows


def parse_twelvedata_ohlcv(payload, start_date, end_date, td_symbol):
    values = payload.get("values") if isinstance(payload, dict) else None
    if not values:
        raise ValueError(f"No market candle data for {td_symbol}")

    df = pd.DataFrame(values)
    date_col = "datetime" if "datetime" in df.columns else "date"
    if date_col not in df.columns:
        raise ValueError("Missing datetime field in market data")

    df["Date"] = pd.to_datetime(df[date_col])
    df["Open"] = pd.to_numeric(df.get("open"), errors="coerce")
    df["High"] = pd.to_numeric(df.get("high"), errors="coerce")
    df["Low"] = pd.to_numeric(df.get("low"), errors="coerce")
    df["Close"] = pd.to_numeric(df.get("close"), errors="coerce")
    df["Volume"] = pd.to_numeric(df.get("volume"), errors="coerce").fillna(0)

    df.set_index("Date", inplace=True)
    df = df.sort_index()
    df = df.loc[start_date:end_date]
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()

    if df.empty:
        raise ValueError(f"Empty market OHLCV data for {td_symbol}")

    return df


def yfinance_ohlcv(symbol, start_date, end_date, exchange="nse", resolution="D"):
    if yf is None:
        raise ValueError("yfinance is not installed")

    yf_symbol = to_yfinance_symbol(symbol, exchange)
    interval_map = {
        "D": "1d",
        "W": "1wk",
        "M": "1mo",
    }
    interval = interval_map.get(str(resolution or "D").upper(), "1d")
    end_plus = (pd.Timestamp(end_date) + pd.Timedelta(days=1)).strftime("%Y-%m-%d")

    history = yf.Ticker(yf_symbol).history(
        start=start_date,
        end=end_plus,
        interval=interval,
        auto_adjust=False,
    )

    if history is None or history.empty:
        raise ValueError(f"No yfinance OHLCV data for {yf_symbol}")

    df = history.copy()
    df.index = pd.to_datetime(df.index)
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
    df = df.loc[start_date:end_date]

    if df.empty:
        raise ValueError(f"Empty yfinance OHLCV data for {yf_symbol}")

    return df


def ohlcv_to_values(df):
    rows = []
    for idx, row in df.iterrows():
        rows.append({
            "datetime": pd.Timestamp(idx).strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": float(row["Volume"]),
        })
    return rows


def get_live_quote(symbol, exchange):
    market_symbol = normalize_market_symbol(symbol, exchange)

    if TWELVEDATA_API_KEY:
        try:
            td_symbol = to_twelvedata_symbol(symbol, exchange)
            td_data, td_cached = twelvedata_call("quote", {"symbol": td_symbol}, cache_ttl=3)

            close_price = safe_float(td_data.get("close"))
            previous_close = safe_float(td_data.get("previous_close"))
            delta = close_price - previous_close
            delta_pct = (delta / previous_close * 100.0) if previous_close else 0.0

            return {
                "symbol": to_client_symbol(td_data.get("symbol") or market_symbol, td_data.get("exchange") or exchange),
                "exchange": str(td_data.get("exchange") or exchange).upper(),
                "quote": {
                    "c": close_price,
                    "d": delta,
                    "dp": delta_pct,
                    "h": safe_float(td_data.get("high")),
                    "l": safe_float(td_data.get("low")),
                    "o": safe_float(td_data.get("open")),
                    "pc": previous_close,
                    "t": int(time.time()),
                },
                "profile": {
                    "symbol": to_client_symbol(td_data.get("symbol") or market_symbol, td_data.get("exchange") or exchange),
                    "name": td_data.get("name"),
                    "exchange": td_data.get("exchange"),
                    "currency": td_data.get("currency"),
                    "mic_code": td_data.get("mic_code"),
                    "type": td_data.get("type"),
                },
                "cached": td_cached,
                "source": "twelvedata",
            }
        except Exception:
            metric_inc("market_fallbacks")
            pass

    try:
        yf_data = yfinance_quote(symbol, exchange)
        metric_inc("market_provider_yfinance_success")
        return {
            **yf_data,
            "cached": False,
            "source": "yfinance",
        }
    except Exception:
        metric_inc("market_provider_yfinance_errors")
        raise


def extract_symbol_and_exchange(symbol_path):
    exchange = infer_exchange(symbol_path, request.args.get("exchange", "auto"))
    symbol = normalize_market_symbol(symbol_path, exchange)
    return symbol, exchange


def save_backtest_record(user_id, payload):
    row = {
        "user_id": user_id,
        "symbol": payload.get("symbol", "UNKNOWN"),
        "strategy": payload.get("strategy", "sma"),
        "parameters": payload.get("parameters", {}),
        "start_date": payload.get("startDate"),
        "end_date": payload.get("endDate"),
        "initial_capital": payload.get("initialCapital", payload.get("cash")),
        "commission": payload.get("commission"),
        "stats": payload.get("results", payload.get("stats", {})),
        "equity_curve": payload.get("equity", []),
        "trades": payload.get("trades", []),
        "updated_at": datetime.utcnow().isoformat(),
    }
    if payload.get("id"):
        row["id"] = payload.get("id")

    response = supabase_admin.table("backtests").upsert(row).execute()
    data = response.data or []
    return data[0] if data else row


# ---------------- SAFE FLOAT ----------------
def safe_float(value):
    try:
        f = float(value)
        return f if math.isfinite(f) else 0.0
    except:
        return 0.0


def normalize_ohlcv_columns(df):
    if df is None or df.empty:
        return df

    rename_map = {}
    for column in df.columns:
        key = str(column).strip().lower().replace("_", " ")
        if key in {"date", "datetime", "timestamp", "time"}:
            rename_map[column] = "Date"
        elif key == "open":
            rename_map[column] = "Open"
        elif key == "high":
            rename_map[column] = "High"
        elif key == "low":
            rename_map[column] = "Low"
        elif key in {"close", "adj close", "adjclose"}:
            rename_map[column] = "Close"
        elif key in {"volume", "vol"}:
            rename_map[column] = "Volume"

    return df.rename(columns=rename_map)


def parse_date_column(series):
    parsed = pd.to_datetime(series, errors="coerce", dayfirst=False)
    valid_ratio = float(parsed.notna().mean()) if len(parsed) else 0.0
    if valid_ratio < 0.7:
        parsed_dayfirst = pd.to_datetime(series, errors="coerce", dayfirst=True)
        valid_ratio_dayfirst = float(parsed_dayfirst.notna().mean()) if len(parsed_dayfirst) else 0.0
        if valid_ratio_dayfirst > valid_ratio:
            parsed = parsed_dayfirst
    return parsed


# ---------------- CSV LOADER ----------------
def load_csv(symbol, start_date, end_date):
    path = None
    candidates = symbol_filename_candidates(symbol)
    for folder in CSV_FOLDERS:
        for base in candidates:
            candidate = os.path.join(folder, f"{base}.csv")
            if os.path.exists(candidate):
                path = candidate
                break
        if path is not None:
            break

    if path is None:
        searched = ", ".join(CSV_FOLDERS)
        raise FileNotFoundError(f"{symbol}.csv not found in: {searched}")

    df = pd.read_csv(path)
    df = normalize_ohlcv_columns(df)

    if "Date" not in df.columns:
        raise ValueError("CSV must contain Date column")

    df["Date"] = parse_date_column(df["Date"])
    df = df.dropna(subset=["Date"])
    df.set_index("Date", inplace=True)
    df = df.sort_index()
    df = df[~df.index.duplicated(keep="last")]

    required = ["Open", "High", "Low", "Close", "Volume"]

    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}")

    for col in required:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["Open", "High", "Low", "Close", "Volume"])

    full_df = df[required]
    filtered_df = full_df.loc[start_date:end_date]

    if filtered_df.empty and not full_df.empty:
        min_date = full_df.index.min().strftime("%Y-%m-%d")
        max_date = full_df.index.max().strftime("%Y-%m-%d")
        raise ValueError(
            f"No CSV rows in selected date range {start_date} to {end_date}. Available data: {min_date} to {max_date}"
        )

    return filtered_df


def load_market_ohlcv(symbol, start_date, end_date, exchange="auto", resolution="D"):

    interval_map = {
        "D": "1day",
        "W": "1week",
        "M": "1month",
    }
    interval = interval_map.get(str(resolution or "D").upper(), "1day")

    errors = []

    for candidate_exchange in exchange_candidates(symbol, exchange):
        market_symbol = normalize_market_symbol(symbol, candidate_exchange)
        td_symbol = to_twelvedata_symbol(market_symbol, candidate_exchange)

        if TWELVEDATA_API_KEY:
            try:
                payload, _ = twelvedata_call(
                    "time_series",
                    {
                        "symbol": td_symbol,
                        "interval": interval,
                        "start_date": start_date,
                        "end_date": end_date,
                        "outputsize": 5000,
                        "order": "ASC",
                    },
                    cache_ttl=60,
                )
                return parse_twelvedata_ohlcv(payload, start_date, end_date, td_symbol), "twelvedata"
            except Exception as e:
                metric_inc("market_fallbacks")
                errors.append(str(e))

        try:
            yf_df = yfinance_ohlcv(symbol, start_date, end_date, exchange=candidate_exchange, resolution=resolution)
            persist_ohlcv_to_csv(symbol, yf_df)
            metric_inc("market_provider_yfinance_success")
            return yf_df, "yfinance"
        except Exception as e:
            metric_inc("market_provider_yfinance_errors")
            errors.append(str(e))

    raise ValueError(errors[-1] if errors else "Unable to load market OHLCV data")


def load_latest_csv_quote(symbol):
    normalized = (symbol or "").upper().strip()
    base_symbol = normalized.split(".")[0]

    path = None
    for folder in CSV_FOLDERS:
        candidate = os.path.join(folder, f"{base_symbol}.csv")
        if os.path.exists(candidate):
            path = candidate
            break

    if path is None:
        return None

    df = pd.read_csv(path)
    if df.empty or "Close" not in df.columns:
        return None

    close_series = pd.to_numeric(df["Close"], errors="coerce").dropna()
    if close_series.empty:
        return None

    current = float(close_series.iloc[-1])
    previous = float(close_series.iloc[-2]) if len(close_series) > 1 else current
    delta = current - previous
    delta_pct = (delta / previous * 100.0) if previous else 0.0

    return {
        "c": current,
        "d": delta,
        "dp": delta_pct,
        "h": current,
        "l": current,
        "o": previous,
        "pc": previous,
        "t": int(time.time()),
    }


# =====================================================
# ================= STRATEGIES ========================
# =====================================================

# ---- BUY AND HOLD ----
class BuyAndHold(Strategy):
    def init(self):
        pass

    def next(self):
        if not self.position:
            self.buy()


# ---- SMA CROSS ----
class SmaCross(Strategy):

    short_window = 20
    long_window = 50

    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, self.short_window)
        self.sma2 = self.I(SMA, self.data.Close, self.long_window)

    def next(self):

        if crossover(self.sma1, self.sma2):

            if self.position:
                self.position.close()

            self.buy()

        elif crossover(self.sma2, self.sma1):

            if self.position:
                self.position.close()


# ---- LONG SHORT SMA ----
class SmaLongShort(Strategy):

    short_window = 20
    long_window = 50

    def init(self):

        self.sma1 = self.I(SMA, self.data.Close, self.short_window)
        self.sma2 = self.I(SMA, self.data.Close, self.long_window)

    def next(self):

        if crossover(self.sma1, self.sma2):

            if self.position.is_short:
                self.position.close()

            if not self.position.is_long:
                self.buy()

        elif crossover(self.sma2, self.sma1):

            if self.position.is_long:
                self.position.close()

            if not self.position.is_short:
                self.sell()


# ---- RSI ----
class RSIStrategy(Strategy):

    window = 14
    oversold = 30
    overbought = 70

    def init(self):

        self.rsi = self.I(self.calc_rsi, self.data.Close, self.window)

    def calc_rsi(self, prices, window):

        prices = pd.Series(prices)

        delta = prices.diff()

        gain = delta.where(delta > 0, 0).rolling(window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window).mean()

        rs = gain / loss

        rsi = 100 - (100 / (1 + rs))

        return rsi.fillna(50)

    def next(self):

        if self.rsi[-1] < self.oversold and not self.position:
            self.buy()

        elif self.rsi[-1] > self.overbought and self.position:
            self.position.close()


# ---- MOMENTUM ----
class MomentumStrategy(Strategy):

    lookback = 10
    threshold = 0.02

    def init(self):

        self.momentum = self.I(
            lambda x: pd.Series(x).pct_change(self.lookback),
            self.data.Close
        )

    def next(self):

        m = self.momentum[-1]

        if m > self.threshold and not self.position:
            self.buy()

        elif m < -self.threshold and self.position:
            self.position.close()


# ---- MEAN REVERSION ----
class MeanReversionStrategy(Strategy):

    window = 20
    entry = 2
    exit = 0.5

    def init(self):

        self.sma = self.I(SMA, self.data.Close, self.window)

        self.std = self.I(
            lambda x: pd.Series(x).rolling(self.window).std(),
            self.data.Close
        )

    def next(self):

        price = self.data.Close[-1]
        sma = self.sma[-1]
        std = self.std[-1]

        if std == 0:
            return

        z = (price - sma) / std

        if z < -self.entry and not self.position:
            self.buy()

        elif abs(z) < self.exit and self.position:
            self.position.close()


# =====================================================
# ================= CSV UPLOAD ========================
# =====================================================

@app.route("/api/upload", methods=["POST"])
def upload_csv():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "File is required"}), 400

        symbol = request.form.get("symbol", "").upper().strip()
        if not symbol:
            return jsonify({"success": False, "error": "Symbol is required"}), 400

        file = request.files["file"]
        path = os.path.join(UPLOAD_FOLDER, f"{symbol}.csv")
        file.save(path)

        saved_path = None
        user = None
        token = get_bearer_token()

        if supabase_ready() and token:
            user, user_error = get_current_user()
            if user_error is None:
                user_id = get_user_id(user)
                if user_id:
                    storage_path = f"{user_id}/{symbol}.csv"
                    with open(path, "rb") as f:
                        supabase_admin.storage.from_("market-data").upload(
                            storage_path,
                            f.read(),
                            {"content-type": "text/csv", "upsert": "true"},
                        )
                    saved_path = storage_path

                    supabase_admin.table("stock_datasets").insert({
                        "user_id": user_id,
                        "symbol": symbol,
                        "source": "csv_upload",
                        "file_path": storage_path,
                        "row_count": int(pd.read_csv(path).shape[0]),
                    }).execute()

        return jsonify({
            "success": True,
            "message": f"{symbol}.csv uploaded",
            "data": {"symbol": symbol, "filePath": saved_path}
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# =====================================================
# ================= BACKTEST ==========================
# =====================================================

@app.route("/api/backtest", methods=["POST"])
def backtest():

    try:

        data = request.json

        symbol = data["symbol"]

        start = data.get("startDate", "1900-01-01")
        end = data.get("endDate", "2100-01-01")

        cash = data.get("cash", 100000)

        commission = data.get("commission", 0.002)
        slippage_bps = safe_float(data.get("slippageBps", 0.0))
        spread_bps = safe_float(data.get("spreadBps", 0.0))
        effective_commission = max(0.0, safe_float(commission) + (slippage_bps / 10000.0))
        spread = max(0.0, spread_bps / 10000.0)

        strategy_name = data.get("strategy", "sma")
        requested_source = str(data.get("dataSource", "auto")).lower().strip()
        exchange = str(data.get("exchange", "auto")).lower().strip() or "auto"
        resolution = data.get("resolution", "D")

        data_source_used = "csv"
        resolved_symbol = symbol

        if requested_source == "market":
            df, live_source = load_market_ohlcv(symbol, start, end, exchange=exchange, resolution=resolution)
            data_source_used = f"market:{live_source}"
            resolved_symbol = normalize_market_symbol(symbol, exchange)
        elif requested_source == "finnhub":
            df, live_source = load_market_ohlcv(symbol, start, end, exchange=exchange, resolution=resolution)
            data_source_used = f"market:{live_source}"
            resolved_symbol = normalize_market_symbol(symbol, exchange)
        elif requested_source == "csv":
            df = load_csv(symbol, start, end)
        else:
            try:
                df = load_csv(symbol, start, end)
                data_source_used = "csv"
            except Exception:
                df, live_source = load_market_ohlcv(symbol, start, end, exchange=exchange, resolution=resolution)
                data_source_used = f"market:{live_source}"
                resolved_symbol = normalize_market_symbol(symbol, exchange)

        loaded_rows = int(len(df))
        loaded_start = df.index.min().strftime("%Y-%m-%d") if loaded_rows > 0 else None
        loaded_end = df.index.max().strftime("%Y-%m-%d") if loaded_rows > 0 else None


        strategy_aliases = {
            "buy-hold": "buy_hold",
            "sma-cross": "sma",
            "long-short": "long_short",
            "mean-reversion": "mean_reversion",
        }

        normalized_strategy_name = strategy_aliases.get(strategy_name, strategy_name)

        strategies = {

            "buy_hold": BuyAndHold,
            "sma": SmaCross,
            "long_short": SmaLongShort,
            "rsi": RSIStrategy,
            "momentum": MomentumStrategy,
            "mean_reversion": MeanReversionStrategy

        }


        strategy = strategies.get(normalized_strategy_name)

        if strategy is None:
            return jsonify({"error": "Invalid strategy"}), 400


        bt = Backtest(df, strategy, cash=cash, commission=effective_commission, spread=spread)
        metric_inc("backtest_runs")

        stats = bt.run()


        equity = stats["_equity_curve"]

        equity_data = [

            {
                "date": i.strftime("%Y-%m-%d"),
                "equity": float(row["Equity"])
            }

            for i, row in equity.iterrows()

        ]


        trades = stats["_trades"]

        trades_data = [

            {

                "entry": t.EntryTime.strftime("%Y-%m-%d"),
                "exit": t.ExitTime.strftime("%Y-%m-%d"),
                "entryPrice": safe_float(getattr(t, "EntryPrice", 0.0)),
                "exitPrice": safe_float(getattr(t, "ExitPrice", 0.0)),
                "shares": abs(safe_float(getattr(t, "Size", 0.0))),
                "type": "LONG" if safe_float(getattr(t, "Size", 0.0)) >= 0 else "SHORT",
                "pnl": float(t.PnL),
                "returnPct": float(t.ReturnPct)

            }

            for _, t in trades.iterrows()

        ]


        response_payload = {

            "success": True,

            "stats": {

                "return": safe_float(stats["Return [%]"]),

                "sharpe": safe_float(stats["Sharpe Ratio"]),

                "maxDrawdown": safe_float(stats["Max. Drawdown [%]"]),

                "trades": int(stats["# Trades"]),

                "finalEquity": safe_float(stats["Equity Final [$]"])

            },

            "equity": equity_data,

            "trades": trades_data

        }

        response_payload["meta"] = {
            "dataSource": data_source_used,
            "requestedSource": requested_source,
            "symbol": symbol,
            "resolvedSymbol": resolved_symbol,
            "exchange": str(exchange).upper(),
            "resolution": resolution,
            "commission": float(effective_commission),
            "slippageBps": float(slippage_bps),
            "spreadBps": float(spread_bps),
            "loadedRows": loaded_rows,
            "loadedStart": loaded_start,
            "loadedEnd": loaded_end,
        }

        token = get_bearer_token()
        if supabase_ready() and token:
            user, user_error = get_current_user()
            if user_error is None:
                user_id = get_user_id(user)
                if user_id:
                    save_backtest_record(user_id, {
                        "symbol": symbol,
                        "strategy": normalized_strategy_name,
                        "startDate": start,
                        "endDate": end,
                        "cash": cash,
                        "commission": commission,
                        "stats": response_payload["stats"],
                        "equity": equity_data,
                        "trades": trades_data,
                    })

        return jsonify(response_payload)


    except Exception as e:
        metric_inc("backtest_failures")

        return jsonify({

            "success": False,
            "error": str(e)

        })


# =====================================================
# ================= HEALTH ============================
# =====================================================

@app.route("/api/health")
def health():
    return {
        "status": "ok",
        "uptimeSeconds": int(time.time() - APP_STARTED_AT),
    }


@app.route("/api/metrics")
def metrics():
    return {
        "success": True,
        "data": {
            **METRICS,
            "uptimeSeconds": int(time.time() - APP_STARTED_AT),
        },
    }


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    if not supabase_ready():
        return jsonify({"success": False, "error": "Supabase is not configured"}), 500

    try:
        payload = request.get_json(force=True)
        email = payload.get("email", "").strip().lower()
        password = payload.get("password", "")
        name = payload.get("name", "")

        if not email or not password:
            return jsonify({"success": False, "error": "Email and password required"}), 400

        created = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name},
        })

        user = getattr(created, "user", None)
        user_id = get_user_id(user)
        if user_id:
            write_profile_if_missing(user_id, name)

        return jsonify({"success": True, "data": {"user": serialize_user(user)}})
    except Exception as e:
        return auth_exception_to_response(e)


@app.route("/api/auth/login", methods=["POST"])
def login():
    if not supabase_ready():
        return jsonify({"success": False, "error": "Supabase is not configured"}), 500

    try:
        payload = request.get_json(force=True)
        email = payload.get("email", "").strip().lower()
        password = payload.get("password", "")
        if not email or not password:
            return jsonify({"success": False, "error": "Email and password required"}), 400

        result = supabase_anon.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        session = getattr(result, "session", None)
        user = getattr(result, "user", None)
        access_token = getattr(session, "access_token", None)

        if not access_token or not user:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        return jsonify({
            "success": True,
            "data": {
                "accessToken": access_token,
                "user": serialize_user(user),
            },
        })
    except Exception as e:
        return auth_exception_to_response(e)


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"success": True})


@app.route("/api/auth/me", methods=["GET"])
def me():
    user, user_error = get_current_user()
    if user_error:
        return user_error
    return jsonify({"success": True, "data": {"user": serialize_user(user)}})


@app.route("/api/backtests", methods=["GET"])
def list_backtests():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table("backtests").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jsonify({"success": True, "data": response.data or []})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/backtests/<backtest_id>", methods=["GET"])
def get_backtest(backtest_id):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table("backtests").select("*").eq("id", backtest_id).eq("user_id", user_id).limit(1).execute()
        rows = response.data or []
        if not rows:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True, "data": rows[0]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/backtests", methods=["POST"])
def create_backtest_record():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        payload = request.get_json(force=True)
        row = save_backtest_record(user_id, payload)
        return jsonify({"success": True, "data": {"id": row.get("id")}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/backtests/<backtest_id>", methods=["PUT"])
def update_backtest(backtest_id):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        updates = request.get_json(force=True)
        updates_row = {
            "symbol": updates.get("symbol"),
            "strategy": updates.get("strategy"),
            "parameters": updates.get("parameters"),
            "start_date": updates.get("startDate"),
            "end_date": updates.get("endDate"),
            "initial_capital": updates.get("initialCapital"),
            "commission": updates.get("commission"),
            "stats": updates.get("results", updates.get("stats")),
            "equity_curve": updates.get("equity"),
            "trades": updates.get("trades"),
            "updated_at": datetime.utcnow().isoformat(),
        }
        filtered = {k: v for k, v in updates_row.items() if v is not None}

        response = supabase_admin.table("backtests").update(filtered).eq("id", backtest_id).eq("user_id", user_id).execute()
        if not response.data:
            return jsonify({"success": False, "error": "Not found"}), 404

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/backtests/<backtest_id>", methods=["DELETE"])
def delete_backtest(backtest_id):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        supabase_admin.table("backtests").delete().eq("id", backtest_id).eq("user_id", user_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def list_generic(table_name):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table(table_name).select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jsonify({"success": True, "data": response.data or []})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def create_generic(table_name, payload):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        payload["user_id"] = user_id
        payload["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table(table_name).insert(payload).execute()
        data = response.data or []
        return jsonify({"success": True, "data": {"id": data[0].get("id") if data else None}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def update_generic(table_name, item_id, payload):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        payload["updated_at"] = datetime.utcnow().isoformat()
        response = supabase_admin.table(table_name).update(payload).eq("id", item_id).eq("user_id", user_id).execute()
        if not response.data:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def delete_generic(table_name, item_id):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        supabase_admin.table(table_name).delete().eq("id", item_id).eq("user_id", user_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/strategies", methods=["GET"])
def list_strategies():
    return list_generic("strategies")


@app.route("/api/strategies", methods=["POST"])
def create_strategy():
    payload = request.get_json(force=True)
    payload = {
        "name": payload.get("name", "Untitled Strategy"),
        "description": payload.get("description"),
        "config": payload.get("config", payload),
    }
    return create_generic("strategies", payload)


@app.route("/api/strategies/<strategy_id>", methods=["DELETE"])
def delete_strategy(strategy_id):
    return delete_generic("strategies", strategy_id)


@app.route("/api/alerts", methods=["GET"])
def list_alerts():
    return list_generic("alerts")


@app.route("/api/alerts", methods=["POST"])
def create_alert():
    payload = request.get_json(force=True)
    row = {
        "symbol": payload.get("symbol", ""),
        "condition_type": payload.get("conditionType", payload.get("type", "price")),
        "condition_value": payload.get("conditionValue", payload.get("condition", "")),
        "metadata": payload.get("metadata", payload),
        "is_active": payload.get("isActive", True),
    }
    return create_generic("alerts", row)


@app.route("/api/alerts/<alert_id>", methods=["PUT"])
def update_alert(alert_id):
    payload = request.get_json(force=True)
    row = {
        "symbol": payload.get("symbol"),
        "condition_type": payload.get("conditionType", payload.get("type")),
        "condition_value": payload.get("conditionValue", payload.get("condition")),
        "metadata": payload.get("metadata", payload),
        "is_active": payload.get("isActive"),
    }
    filtered = {k: v for k, v in row.items() if v is not None}
    return update_generic("alerts", alert_id, filtered)


@app.route("/api/alerts/<alert_id>", methods=["DELETE"])
def delete_alert(alert_id):
    return delete_generic("alerts", alert_id)


@app.route("/api/portfolios", methods=["GET"])
def list_portfolios():
    return list_generic("portfolios")


@app.route("/api/portfolios/sync", methods=["PUT"])
def sync_portfolios():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        payload = request.get_json(force=True) or {}
        items = payload.get("items", [])
        if not isinstance(items, list):
            return jsonify({"success": False, "error": "items must be an array"}), 400

        user_id = get_user_id(user)
        supabase_admin.table("portfolios").delete().eq("user_id", user_id).execute()

        rows = []
        for item in items:
            if not isinstance(item, dict):
                continue
            row = {
                "user_id": user_id,
                "name": item.get("name", "Untitled Portfolio"),
                "holdings": item.get("holdings", []),
                "metadata": item,
                "updated_at": datetime.utcnow().isoformat(),
            }
            if item.get("id"):
                row["id"] = item.get("id")
            rows.append(row)

        if rows:
            supabase_admin.table("portfolios").insert(rows).execute()

        return jsonify({"success": True, "data": {"count": len(rows)}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/portfolios", methods=["POST"])
def create_portfolio():
    payload = request.get_json(force=True)
    row = {
        "name": payload.get("name", "Untitled Portfolio"),
        "holdings": payload.get("holdings", []),
        "metadata": payload.get("metadata", payload),
    }
    return create_generic("portfolios", row)


@app.route("/api/portfolios/<portfolio_id>", methods=["PUT"])
def update_portfolio(portfolio_id):
    payload = request.get_json(force=True)
    row = {
        "name": payload.get("name"),
        "holdings": payload.get("holdings"),
        "metadata": payload.get("metadata", payload),
    }
    filtered = {k: v for k, v in row.items() if v is not None}
    return update_generic("portfolios", portfolio_id, filtered)


@app.route("/api/portfolios/<portfolio_id>", methods=["DELETE"])
def delete_portfolio(portfolio_id):
    return delete_generic("portfolios", portfolio_id)


@app.route("/api/watchlist", methods=["GET"])
def list_watchlist():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table("watchlists").select("*").eq("user_id", user_id).execute()
        return jsonify({"success": True, "data": response.data or []})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/watchlist/sync", methods=["PUT"])
def sync_watchlist():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        payload = request.get_json(force=True) or {}
        items = payload.get("items", [])
        if not isinstance(items, list):
            return jsonify({"success": False, "error": "items must be an array"}), 400

        user_id = get_user_id(user)
        supabase_admin.table("watchlists").delete().eq("user_id", user_id).execute()

        rows = []
        for item in items:
            if not isinstance(item, dict):
                continue
            symbol = str(item.get("symbol", "")).upper().strip()
            if not symbol:
                continue
            rows.append({
                "user_id": user_id,
                "symbol": symbol,
                "name": item.get("name", symbol),
                "exchange": item.get("exchange"),
                "metadata": item,
                "updated_at": datetime.utcnow().isoformat(),
            })

        if rows:
            supabase_admin.table("watchlists").insert(rows).execute()

        return jsonify({"success": True, "data": {"count": len(rows)}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/upload-data", methods=["POST"])
def upload_stock_data():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        payload = request.get_json(force=True)
        symbol = payload.get("symbol", "").upper().strip()
        data = payload.get("data", [])
        if not symbol:
            return jsonify({"success": False, "error": "Symbol is required"}), 400

        user_id = get_user_id(user)
        response = supabase_admin.table("stock_datasets").insert({
            "user_id": user_id,
            "symbol": symbol,
            "source": "api_upload",
            "data": data,
            "row_count": len(data) if isinstance(data, list) else 0,
            "updated_at": datetime.utcnow().isoformat(),
        }).execute()

        rows = response.data or []
        return jsonify({"success": True, "data": {"symbol": symbol, "id": rows[0].get("id") if rows else None}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/stock-data/<symbol>", methods=["GET"])
def get_stock_data(symbol):
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table("stock_datasets").select("*").eq("user_id", user_id).eq("symbol", symbol.upper()).order("created_at", desc=True).limit(1).execute()
        rows = response.data or []
        if not rows:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True, "data": rows[0]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/stock-data", methods=["GET"])
def list_stock_data():
    user, user_error = get_current_user()
    if user_error:
        return user_error

    try:
        user_id = get_user_id(user)
        response = supabase_admin.table("stock_datasets").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jsonify({"success": True, "data": response.data or []})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/market/quote/<symbol>", methods=["GET"])
def market_quote(symbol):
    try:
        metric_inc("market_quote_requests")
        _, exchange = extract_symbol_and_exchange(symbol)
        live_data = get_live_quote(symbol, exchange)

        return jsonify({
            "success": True,
            "data": {
                "symbol": live_data.get("symbol"),
                "exchange": live_data.get("exchange") or str(exchange).upper(),
                "quote": live_data.get("quote"),
                "cached": bool(live_data.get("cached", False)),
                "pollingSeconds": 10,
                "source": live_data.get("source"),
            },
        })
    except Exception as e:
        fallback_quote = load_latest_csv_quote(symbol)
        if fallback_quote is not None:
            market_symbol, exchange = extract_symbol_and_exchange(symbol)
            return jsonify({
                "success": True,
                "data": {
                    "symbol": market_symbol,
                    "exchange": exchange.upper(),
                    "quote": fallback_quote,
                    "cached": True,
                    "pollingSeconds": 30,
                    "source": "csv-fallback",
                },
                "warning": "Live quote unavailable; serving latest CSV close",
            })
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/market/search", methods=["GET"])
def market_search():
    try:
        metric_inc("market_search_requests")
        query = (request.args.get("q") or "").strip()
        if len(query) < 1:
            return jsonify({"success": True, "data": []})

        if not TWELVEDATA_API_KEY:
            raise ValueError("TWELVEDATA_API_KEY is not configured")

        td_data, td_cached = twelvedata_call("symbol_search", {"symbol": query, "outputsize": 20}, cache_ttl=60)
        td_rows = []
        for item in (td_data.get("data") if isinstance(td_data, dict) else []) or []:
            if not isinstance(item, dict):
                continue
            symbol = to_client_symbol(item.get("symbol"), item.get("exchange"))
            if not symbol:
                continue
            td_rows.append({
                "symbol": symbol,
                "description": item.get("instrument_name") or symbol,
                "displaySymbol": item.get("symbol") or symbol,
                "type": item.get("type"),
                "exchange": item.get("exchange"),
            })
        return jsonify({"success": True, "data": td_rows, "cached": td_cached, "source": "twelvedata"})
    except Exception as e:
        try:
            yf_rows = yfinance_search_symbols(query, limit=20)
            return jsonify({
                "success": True,
                "data": yf_rows,
                "cached": False,
                "source": "yfinance",
                "warning": f"Twelve Data unavailable ({str(e)}), using yfinance",
            })
        except Exception as yf_error:
            return jsonify({"success": False, "error": f"{str(e)}; yfinance fallback failed: {str(yf_error)}"}), 500


@app.route("/api/market/candles/<symbol>", methods=["GET"])
def market_candles(symbol):
    try:
        metric_inc("market_candles_requests")
        market_symbol, exchange = extract_symbol_and_exchange(symbol)

        resolution = request.args.get("resolution", "D")
        start_date = request.args.get("startDate", request.args.get("from", (datetime.utcnow().replace(day=1)).strftime("%Y-%m-%d")))
        end_date = request.args.get("endDate", request.args.get("to", datetime.utcnow().strftime("%Y-%m-%d")))

        df, source = load_market_ohlcv(market_symbol, start_date, end_date, exchange=exchange, resolution=resolution)
        values = ohlcv_to_values(df)
        data = {
            "meta": {
                "symbol": market_symbol,
                "interval": resolution,
                "exchange": str(exchange).upper(),
            },
            "values": values,
        }

        return jsonify({
            "success": True,
            "data": {
                "symbol": to_client_symbol(market_symbol, exchange),
                "exchange": exchange.upper(),
                "resolution": resolution,
                "from": start_date,
                "to": end_date,
                "candles": data,
                "cached": source == "twelvedata",
                "source": source,
            },
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/market/profile/<symbol>", methods=["GET"])
def market_profile(symbol):
    try:
        _, exchange = extract_symbol_and_exchange(symbol)
        live_data = get_live_quote(symbol, exchange)
        profile = enrich_profile(
            live_data.get("symbol") or symbol,
            live_data.get("exchange") or exchange,
            live_data.get("profile") or {},
        )
        return jsonify({
            "success": True,
            "data": {
                "symbol": live_data.get("symbol"),
                "exchange": live_data.get("exchange") or str(exchange).upper(),
                "profile": profile,
                "cached": bool(live_data.get("cached", False)),
                "source": live_data.get("source"),
            },
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/market/news/<symbol>", methods=["GET"])
def market_news(symbol):
    return jsonify({
        "success": False,
        "error": "Market news endpoint is not available with the current provider",
        "source": "twelvedata",
    }), 501


@app.route("/api/market/sentiment/<symbol>", methods=["GET"])
def market_sentiment(symbol):
    return jsonify({
        "success": False,
        "error": "Market sentiment endpoint is not available with the current provider",
        "source": "twelvedata",
    }), 501


@app.route("/api/market/all/<symbol>", methods=["GET"])
def market_all(symbol):
    try:
        _, exchange = extract_symbol_and_exchange(symbol)
        live_data = get_live_quote(symbol, exchange)
        profile = enrich_profile(
            live_data.get("symbol") or symbol,
            live_data.get("exchange") or exchange,
            live_data.get("profile") or {},
        )

        return jsonify({
            "success": True,
            "data": {
                "symbol": live_data.get("symbol"),
                "exchange": live_data.get("exchange") or str(exchange).upper(),
                "quote": live_data.get("quote"),
                "profile": profile,
                "news": [],
                "sentiment": {},
                "cache": {
                    "quote": bool(live_data.get("cached", False)),
                    "profile": bool(live_data.get("cached", False)),
                    "news": True,
                    "sentiment": True,
                },
                "pollingSeconds": 10,
                "source": live_data.get("source"),
            },
            "warning": "News and sentiment are unavailable with the current provider",
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# =====================================================

if __name__ == "__main__":

    print("CSV Backtesting API running")

    app.run(debug=True, port=5000)