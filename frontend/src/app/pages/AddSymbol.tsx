import { motion } from "motion/react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { marketAPI, watchlistAPI } from "../../utils/api";
import { loadWatchlist, saveWatchlist, type WatchlistItem } from "../../utils/watchlist";

type Suggestion = {
  symbol: string;
  description?: string;
  displaySymbol?: string;
  type?: string;
  exchange?: string;
};

export default function AddSymbol() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

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
        const filtered = rows.filter((row) => {
          const value = String(row.symbol || "").toUpperCase();
          return value.includes(".NS") || value.includes(".BO") || !value.includes(".");
        });
        setSuggestions(filtered.slice(0, 8));
      } catch {
        const q = trimmed.toUpperCase();
        setSuggestions([
          { symbol: q, description: q, exchange: "US" },
          { symbol: `${q}.NS`, description: `${q} (NSE)`, exchange: "NSE" },
          { symbol: `${q}.BO`, description: `${q} (BSE)`, exchange: "BSE" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const canSave = useMemo(() => {
    return !!selected || query.trim().length > 0;
  }, [selected, query]);

  const handleAdd = async () => {
    const source = selected || { symbol: query.trim().toUpperCase(), description: query.trim().toUpperCase() };
    const symbol = String(source.symbol || "").trim().toUpperCase();

    if (!symbol) {
      toast.error("Enter a symbol first");
      return;
    }

    const existing = loadWatchlist();
    if (existing.some((row) => row.symbol.toUpperCase() === symbol)) {
      toast.error(`${symbol} already exists in your watchlist`);
      return;
    }

    const nextItem: WatchlistItem = {
      symbol,
      name: String(source.description || symbol),
      exchange:
        String(source.exchange || "").trim() ||
        (symbol.includes(".BO") ? "BSE" : symbol.includes(".NS") ? "NSE" : "nse"),
      price: 0,
      change: 0,
      changePercent: 0,
      volume: "-",
      sparkline: [],
    };

    const next = [nextItem, ...existing];
    saveWatchlist(next);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required to save watchlist to Supabase");
      return;
    }

    try {
      await watchlistAPI.sync(next);
      toast.success(`${symbol} added to watchlist`);
      navigate("/portfolio");
    } catch {
      toast.error("Failed to save watchlist to Supabase");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Add Symbol</h1>
          <button
            onClick={() => navigate("/portfolio")}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Search and add a symbol to your watchlist</p>

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

        <div className="rounded-lg border border-white/10 bg-white/5 max-h-64 overflow-auto">
          {isLoading && <p className="text-sm text-gray-400 p-3">Searching...</p>}
          {!isLoading && query.trim() && suggestions.length === 0 && (
            <p className="text-sm text-gray-400 p-3">No matches found</p>
          )}
          {!isLoading && suggestions.map((item) => {
            const isActive = selected?.symbol === item.symbol;
            return (
              <button
                key={item.symbol}
                onClick={() => {
                  setSelected(item);
                  setQuery(item.symbol);
                }}
                className={`w-full text-left px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/10 ${isActive ? "bg-white/10" : ""}`}
              >
                <p className="font-medium">{item.symbol}</p>
                <p className="text-xs text-gray-400">{item.description || "-"}</p>
              </button>
            );
          })}
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
            Add Symbol
          </button>
        </div>
      </motion.div>
    </div>
  );
}
