import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { marketAPI } from "../../utils/api";

type CandlePoint = {
  datetime: string;
  close: number;
};

type TimeframeKey = "1M" | "3M" | "6M" | "1Y";

const FALLBACK_EXCHANGES = ["us", "nse", "bse"];
const TIMEFRAME_OPTIONS: { key: TimeframeKey; days: number; label: string }[] = [
  { key: "1M", days: 30, label: "1M" },
  { key: "3M", days: 90, label: "3M" },
  { key: "6M", days: 180, label: "6M" },
  { key: "1Y", days: 365, label: "1Y" },
];
const QUOTE_REFRESH_MS = 10000;
const CANDLES_REFRESH_MS = 60000;

function getDateRange(days: number) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);

  return {
    startDate: fromDate.toISOString().slice(0, 10),
    endDate: toDate.toISOString().slice(0, 10),
  };
}

function formatNumber(value: unknown, digits = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "N/A";
  }
  return parsed.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCompact(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatPercent(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "N/A";
  }

  const pct = Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
  return `${pct.toFixed(2)}%`;
}

export default function StockDetails() {
  const navigate = useNavigate();
  const { symbol = "" } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchange, setExchange] = useState<string>((searchParams.get("exchange") || "").toLowerCase());
  const [quote, setQuote] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<CandlePoint[]>([]);
  const [source, setSource] = useState<string>("");
  const [timeframe, setTimeframe] = useState<TimeframeKey>("3M");

  const preferredExchange = (searchParams.get("exchange") || "").toLowerCase();

  const timeframeMeta = useMemo(
    () => TIMEFRAME_OPTIONS.find((item) => item.key === timeframe) || TIMEFRAME_OPTIONS[1],
    [timeframe]
  );

  useEffect(() => {
    let active = true;

    const load = async (withCandles: boolean) => {
      const candidates = [preferredExchange, ...FALLBACK_EXCHANGES].filter((value, index, arr) => {
        if (!value) {
          return false;
        }
        return arr.indexOf(value) === index;
      });

      const { startDate, endDate } = getDateRange(timeframeMeta.days);

      let lastError: unknown = null;

      for (const candidateExchange of candidates) {
        try {
          const allPromise = marketAPI.getAll(symbol, candidateExchange);
          const candlesPromise = withCandles
            ? marketAPI.getCandles(symbol, {
                exchange: candidateExchange,
                resolution: "D",
                startDate,
                endDate,
              })
            : Promise.resolve(null);

          const [allRes, candlesRes] = await Promise.all([allPromise, candlesPromise]);

          const allData = allRes?.data || {};

          if (!active) {
            return;
          }

          setExchange(String(allData.exchange || candidateExchange || "").toLowerCase());
          setQuote(allData.quote || {});
          setProfile(allData.profile || {});
          setSource(String(allData.source || ""));

          if (withCandles) {
            const candleValues = candlesRes?.data?.candles?.values || [];
            if (!Array.isArray(candleValues) || candleValues.length === 0) {
              throw new Error("No price-time data available for this symbol");
            }

            setChartData(
              candleValues
                .map((row: any) => ({
                  datetime: String(row.datetime || ""),
                  close: Number(row.close),
                }))
                .filter((row: CandlePoint) => row.datetime && Number.isFinite(row.close))
            );
          }

          setError(null);
          return;
        } catch (fetchError) {
          lastError = fetchError;
        }
      }

      if (active && withCandles) {
        setError(lastError instanceof Error ? lastError.message : "Unable to load stock details right now");
      }
    };

    setLoading(true);
    setError(null);
    load(true).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    const quoteTimer = setInterval(() => {
      load(false);
    }, QUOTE_REFRESH_MS);

    const candlesTimer = setInterval(() => {
      load(true);
    }, CANDLES_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(quoteTimer);
      clearInterval(candlesTimer);
    };
  }, [symbol, preferredExchange, timeframeMeta.days]);

  const trendUp = Number(quote?.dp || 0) >= 0;
  const quoteTimestampMs = Number(quote?.t || 0) > 0 ? Number(quote?.t) * 1000 : Date.now();
  const quoteAgeSeconds = Math.max(0, Math.round((Date.now() - quoteTimestampMs) / 1000));
  const isStale = quoteAgeSeconds > 40;

  const ratioCards = useMemo(
    () => [
      { label: "Market Cap", value: formatCompact(profile?.marketCap) },
      { label: "P/E Ratio", value: formatNumber(profile?.trailingPE) },
      { label: "Forward P/E", value: formatNumber(profile?.forwardPE) },
      { label: "Price to Book", value: formatNumber(profile?.priceToBook) },
      { label: "Dividend Yield", value: formatPercent(profile?.dividendYield) },
      { label: "Beta", value: formatNumber(profile?.beta) },
      { label: "52W High", value: formatNumber(profile?.fiftyTwoWeekHigh) },
      { label: "52W Low", value: formatNumber(profile?.fiftyTwoWeekLow) },
    ],
    [profile]
  );

  const overviewCards = [
    { label: "Open", value: formatNumber(quote?.o) },
    { label: "Day High", value: formatNumber(quote?.h) },
    { label: "Day Low", value: formatNumber(quote?.l) },
    { label: "Prev Close", value: formatNumber(quote?.pc) },
    { label: "Currency", value: profile?.currency || "N/A" },
    { label: "Exchange", value: profile?.exchange || exchange.toUpperCase() || "N/A" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/portfolio")}
          className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Watchlist
        </button>
      </div>

      {loading ? (
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-gray-400">Loading stock details...</div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">{error}</div>
      ) : (
        <>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{profile?.longName || profile?.name || symbol}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {symbol.toUpperCase()} {exchange ? `• ${exchange.toUpperCase()}` : ""}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source: {(source || "-").toUpperCase()} • Updated {new Date(quoteTimestampMs).toLocaleTimeString()}
                </p>
                {(profile?.sector || profile?.industry) && (
                  <p className="text-sm text-gray-400 mt-1">
                    {[profile?.sector, profile?.industry].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold">{formatNumber(quote?.c)}</p>
                <div className={`inline-flex items-center gap-1 mt-1 ${trendUp ? "text-green-400" : "text-red-400"}`}>
                  {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>
                    {Number(quote?.d || 0) >= 0 ? "+" : ""}
                    {formatNumber(quote?.d)} ({Number(quote?.dp || 0) >= 0 ? "+" : ""}
                    {formatPercent(quote?.dp)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">Price vs Time ({timeframeMeta.label})</h2>
              <div className="flex items-center gap-2">
                {TIMEFRAME_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setTimeframe(option.key)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      timeframe === option.key
                        ? "bg-green-500/20 border-green-500/40 text-green-300"
                        : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="datetime"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    domain={["auto", "auto"]}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17, 24, 39, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={trendUp ? "#22c55e" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Live quote refreshes every 10s and chart refreshes every 60s from market API.
            </p>
            {isStale && (
              <p className="text-xs text-yellow-400 mt-1">
                Data may be stale ({quoteAgeSeconds}s old). Provider fallback may be active.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ratioCards.map((ratio) => (
              <div key={ratio.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <p className="text-sm text-gray-400 mb-1">{ratio.label}</p>
                <p className="text-xl font-semibold">{ratio.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewCards.map((metric) => (
              <div key={metric.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <p className="text-sm text-gray-400 mb-1">{metric.label}</p>
                <p className="text-lg font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
