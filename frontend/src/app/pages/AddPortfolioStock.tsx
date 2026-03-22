import { motion } from "motion/react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { marketAPI, portfoliosAPI } from "../../utils/api";
import { loadPortfolios, normalizePortfolios, savePortfolios } from "../../utils/portfolios";

type Suggestion = {
  symbol: string;
  description?: string;
  displaySymbol?: string;
  exchange?: string;
};

type QuotePreview = {
  symbol: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  source?: string;
};

export default function AddPortfolioStock() {
  const navigate = useNavigate();
  const { portfolioId } = useParams();

  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [avgPrice, setAvgPrice] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quotePreview, setQuotePreview] = useState<QuotePreview | null>(null);
  const [cloudRows, setCloudRows] = useState<any[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    portfoliosAPI
      .getAll()
      .then((response) => {
        const rows = normalizePortfolios((response?.data || []).map((row: any) => row?.metadata || row));
        if (rows.length) {
          savePortfolios(rows);
          setCloudRows(rows);
        }
      })
      .catch(() => {
      });
  }, []);

  const portfolio = useMemo(() => {
    const rows = cloudRows || loadPortfolios();
    return rows.find((item) => item.id === portfolioId) || null;
  }, [portfolioId, cloudRows]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await marketAPI.searchSymbols(trimmed);
        const rows = (response?.data || []) as Suggestion[];
        setSuggestions(rows.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const source = selected || (query.trim() ? { symbol: query.trim().toUpperCase(), exchange: "NSE" } : null);
    if (!source?.symbol) {
      setQuotePreview(null);
      return;
    }

    const symbol = String(source.symbol || "").toUpperCase().trim();
    const exchange = String(source.exchange || "nse");
    const stripped = symbol.replace(/(\.NS|\.BO)$/i, "");

    const candidates = [
      { symbol, exchange },
      { symbol: stripped, exchange: "us" },
      { symbol: stripped, exchange: "nse" },
      { symbol: stripped, exchange: "bse" },
    ];

    let active = true;
    setIsQuoteLoading(true);

    const run = async () => {
      for (const candidate of candidates) {
        try {
          const response = await marketAPI.getQuote(candidate.symbol, candidate.exchange);
          const quote = response?.data?.quote || {};
          const price = Number(quote.c ?? 0);
          if (!price || Number.isNaN(price)) {
            continue;
          }

          if (!active) {
            return;
          }

          setQuotePreview({
            symbol: String(response?.data?.symbol || candidate.symbol).toUpperCase(),
            exchange: String(response?.data?.exchange || candidate.exchange).toUpperCase(),
            price,
            change: Number(quote.d ?? 0),
            changePercent: Number(quote.dp ?? 0),
            source: String(response?.data?.source || ""),
          });
          setIsQuoteLoading(false);
          return;
        } catch {
        }
      }

      if (active) {
        setQuotePreview(null);
        setIsQuoteLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [selected, query]);

  const canSave = useMemo(() => {
    return !!(selected || query.trim()) && Number(quantity) > 0;
  }, [selected, query, quantity]);

  const handleAdd = async () => {
    if (!portfolio) {
      toast.error("Portfolio not found");
      navigate("/portfolio");
      return;
    }

    const source = selected || {
      symbol: query.trim().toUpperCase(),
      description: query.trim().toUpperCase(),
      exchange: "NSE",
    };

    const symbol = String(source.symbol || "").trim().toUpperCase();
    if (!symbol) {
      toast.error("Select a symbol first");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const avg = Number(avgPrice || quotePreview?.price || 0);

    const rows = loadPortfolios();
    const next = rows.map((row) => {
      if (row.id !== portfolio.id) {
        return row;
      }

      if (row.holdings.some((holding) => holding.symbol.toUpperCase() === symbol)) {
        toast.error(`${symbol} is already in this portfolio`);
        return row;
      }

      return {
        ...row,
        holdings: [
          {
            symbol: String(quotePreview?.symbol || symbol).toUpperCase(),
            name: String(source.description || symbol),
            exchange: String(quotePreview?.exchange || source.exchange || "NSE"),
            quantity: qty,
            avgPrice: avg,
            price: Number(quotePreview?.price || avg),
            change: Number(quotePreview?.change || 0),
            changePercent: Number(quotePreview?.changePercent || 0),
            sparkline: [],
          },
          ...row.holdings,
        ],
      };
    });

    savePortfolios(next);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required to save holdings to Supabase");
      return;
    }

    try {
      await portfoliosAPI.sync(next);
      toast.success(`${symbol} added to ${portfolio.name}`);
      navigate("/portfolio");
    } catch {
      toast.error("Failed to save holdings to Supabase");
    }
  };

  if (!portfolio) {
    return (
      <div className="p-6">
        <p className="text-gray-400 mb-3">Portfolio not found.</p>
        <button
          onClick={() => navigate("/portfolio")}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
        >
          Back to Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Add Stock to {portfolio.name}</h1>
          <button
            onClick={() => navigate("/portfolio")}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Type symbol or company name..."
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm"
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 max-h-56 overflow-auto mb-4">
          {isLoading && <p className="text-sm text-gray-400 p-3">Searching...</p>}
          {!isLoading && query.trim() && suggestions.length === 0 && (
            <p className="text-sm text-gray-400 p-3">No matches found</p>
          )}
          {!isLoading && suggestions.map((item) => (
            <button
              key={`${item.symbol}-${item.exchange || ""}`}
              onClick={() => {
                setSelected(item);
                setQuery(item.symbol);
              }}
              className={`w-full text-left px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/10 ${selected?.symbol === item.symbol ? "bg-white/10" : ""}`}
            >
              <p className="font-medium">{item.symbol}</p>
              <p className="text-xs text-gray-400">{item.description || "-"}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Avg Price (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg border border-white/10 bg-white/5">
          {isQuoteLoading && <p className="text-sm text-gray-400">Fetching current price...</p>}
          {!isQuoteLoading && quotePreview && (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Current Price</p>
                <p className="text-xs text-gray-400">
                  {quotePreview.symbol} • {quotePreview.exchange || "-"} {quotePreview.source ? `• ${quotePreview.source}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹{quotePreview.price.toFixed(2)}</p>
                <p className={`text-xs ${quotePreview.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {quotePreview.changePercent >= 0 ? "+" : ""}
                  {quotePreview.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          )}
          {!isQuoteLoading && !quotePreview && query.trim() && (
            <p className="text-sm text-gray-400">Current price unavailable for this symbol right now.</p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => navigate("/portfolio")}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canSave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Stock
          </button>
        </div>
      </motion.div>
    </div>
  );
}
