import { motion } from "motion/react";
import { Plus, TrendingUp, TrendingDown, Star, MoreVertical, Eye, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { marketAPI, portfoliosAPI, watchlistAPI } from "../../utils/api";
import { loadWatchlist, normalizeWatchlistRows, saveWatchlist, type WatchlistItem } from "../../utils/watchlist";
import { getPortfolioMetrics, loadPortfolios, normalizePortfolios, savePortfolios, type PortfolioRecord } from "../../utils/portfolios";

export default function Portfolio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"watchlist" | "portfolios">("watchlist");
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const watchlistRef = useRef<WatchlistItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required to manage Supabase-backed portfolios");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const rows = loadWatchlist();
    watchlistRef.current = rows;
    setWatchlistItems(rows);

    const savedPortfolios = loadPortfolios();
    setPortfolios(savedPortfolios);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    const hydrateCloudState = async () => {
      try {
        const [watchlistRes, portfolioRes] = await Promise.all([
          watchlistAPI.getAll(),
          portfoliosAPI.getAll(),
        ]);

        const cloudWatchlist = normalizeWatchlistRows((watchlistRes?.data || []).map((row: any) => row?.metadata || row));
        const cloudPortfolios = normalizePortfolios((portfolioRes?.data || []).map((row: any) => row?.metadata || row));

        if (cloudWatchlist.length) {
          const mergedWatchlist = [...rows, ...cloudWatchlist].filter((item, index, arr) => (
            index === arr.findIndex((row) => row.symbol.toUpperCase() === item.symbol.toUpperCase())
          ));
          watchlistRef.current = mergedWatchlist;
          setWatchlistItems(mergedWatchlist);
          saveWatchlist(mergedWatchlist);
        }

        if (cloudPortfolios.length) {
          const mergedPortfolios = [...savedPortfolios, ...cloudPortfolios].filter((item, index, arr) => (
            index === arr.findIndex((row) => row.id === item.id)
          ));
          setPortfolios(mergedPortfolios);
          savePortfolios(mergedPortfolios);
        }
      } catch {
      }
    };

    hydrateCloudState();
  }, []);

  useEffect(() => {
    watchlistRef.current = watchlistItems;
    saveWatchlist(watchlistItems);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    watchlistAPI.sync(watchlistItems).catch(() => {
    });
  }, [watchlistItems]);

  useEffect(() => {
    savePortfolios(portfolios);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    portfoliosAPI.sync(portfolios).catch(() => {
    });
  }, [portfolios]);

  useEffect(() => {
    let active = true;

    const refreshQuotes = async () => {
      const rows = watchlistRef.current;
      if (!rows.length) {
        return;
      }

      const next = await Promise.all(
        rows.map(async (item) => {
          const symbol = String(item.symbol || "").toUpperCase().trim();
          const initialExchange = String(item.exchange || "nse");
          const stripped = symbol.replace(/(\.NS|\.BO)$/i, "");

          const candidates = [
            { symbol, exchange: initialExchange },
            { symbol: stripped, exchange: "us" },
            { symbol: stripped, exchange: "nse" },
            { symbol: stripped, exchange: "bse" },
          ].filter((candidate, index, arr) => {
            if (!candidate.symbol) {
              return false;
            }
            return (
              index ===
              arr.findIndex(
                (row) =>
                  row.symbol.toUpperCase() === candidate.symbol.toUpperCase() &&
                  String(row.exchange).toLowerCase() === String(candidate.exchange).toLowerCase()
              )
            );
          });

          for (const candidate of candidates) {
            try {
              const response = await marketAPI.getQuote(candidate.symbol, candidate.exchange);
              const quote = response?.data?.quote || {};
              const current = Number(quote.c ?? 0);

              if (!current || Number.isNaN(current)) {
                continue;
              }

              const change = Number(quote.d ?? item.change ?? 0);
              const changePercent = Number(quote.dp ?? item.changePercent ?? 0);
              const sparkline = [...(item.sparkline || []), current].slice(-20);

              return {
                ...item,
                symbol: String(response?.data?.symbol || candidate.symbol).toUpperCase(),
                exchange: String(response?.data?.exchange || candidate.exchange),
                price: current,
                change,
                changePercent,
                sparkline,
                source: String(response?.data?.source || ""),
                updatedAt: new Date((Number(quote.t || 0) || Date.now() / 1000) * 1000).toISOString(),
              };
            } catch {
            }
          }

          return item;
        })
      );

      if (active) {
        setWatchlistItems(next);
      }
    };

    refreshQuotes();
    const timer = setInterval(refreshQuotes, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleRemoveSymbol = (symbol: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required");
      return;
    }
    setWatchlistItems((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const handleAddPortfolio = () => {
    navigate("/portfolio/add-portfolio");
  };

  const handleDeletePortfolio = (portfolioId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required");
      return;
    }
    setPortfolios((prev) => prev.filter((portfolio) => portfolio.id !== portfolioId));
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Manager</h1>
          <p className="text-gray-400">Track your watchlists and manage multiple portfolios</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (activeTab === "portfolios") {
              handleAddPortfolio();
              return;
            }
            navigate("/portfolio/add-symbol");
          }}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          {activeTab === "portfolios" ? "Add Portfolio" : "Add Symbol"}
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-white/10"
      >
        {[
          { id: "watchlist", label: "Watchlist" },
          { id: "portfolios", label: "Portfolios" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? "text-white border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Watchlist Tab */}
      {activeTab === "watchlist" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {watchlistItems.length === 0 && (
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
              <p className="text-gray-400 mb-3">No symbols in your watchlist yet.</p>
              <button
                onClick={() => navigate("/portfolio/add-symbol")}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium"
              >
                Add Symbol
              </button>
            </div>
          )}
          {watchlistItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all group"
            >
              <div className="flex items-center gap-6">
                {/* Symbol Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{item.symbol}</h3>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={18} className="text-gray-400 hover:text-yellow-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(item.source || "-").toUpperCase()} • {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString() : "-"}
                  </p>
                </div>

                {/* Sparkline */}
                <div className="w-32 h-16 hidden lg:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(item.sparkline || []).map((v) => ({ value: v }))}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={Number(item.changePercent || 0) >= 0 ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Price Info */}
                <div className="text-right">
                  <p className="text-2xl font-bold mb-1">₹{Number(item.price || 0).toFixed(2)}</p>
                  <div
                    className={`flex items-center gap-1 justify-end ${
                      Number(item.changePercent || 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {Number(item.changePercent || 0) >= 0 ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    <span className="font-semibold">
                      {Number(item.changePercent || 0) >= 0 ? "+" : ""}
                      {Number(item.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Volume */}
                <div className="hidden md:block text-right">
                  <p className="text-sm text-gray-400 mb-1">Volume</p>
                  <p className="font-semibold">{item.volume || "-"}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30"
                    onClick={() => {
                      const safeSymbol = encodeURIComponent(String(item.symbol || "").toUpperCase());
                      const exchange = encodeURIComponent(String(item.exchange || "nse").toLowerCase());
                      navigate(`/portfolio/stock/${safeSymbol}?exchange=${exchange}`);
                    }}
                  >
                    <Eye size={18} className="text-blue-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
                    onClick={() => handleRemoveSymbol(item.symbol)}
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Portfolios Tab */}
      {activeTab === "portfolios" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
              <p className="text-gray-400 mb-3">No portfolios yet.</p>
              <button
                onClick={handleAddPortfolio}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium"
              >
                Add Portfolio
              </button>
            </div>
          )}
          {portfolios.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${portfolio.color}-500/20 flex items-center justify-center`}
                >
                  <TrendingUp className={`text-${portfolio.color}-400`} size={24} />
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId((current) => (current === portfolio.id ? null : portfolio.id));
                  }}
                >
                  <MoreVertical size={18} className="text-gray-400" />
                </button>
              </div>

              {openMenuId === portfolio.id && (
                <div className="absolute right-6 top-14 z-10 min-w-[180px] rounded-lg border border-white/10 bg-background/95 backdrop-blur-xl p-2 shadow-xl space-y-1">
                  <button
                    onClick={() => {
                      navigate(`/portfolio/${portfolio.id}/holdings`);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 text-sm"
                  >
                    View Stocks
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/portfolio/${portfolio.id}/add-stock`);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 text-sm"
                  >
                    Add Stock
                  </button>
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-red-500/20 text-sm text-red-400"
                  >
                    Delete Portfolio
                  </button>
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{portfolio.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{getPortfolioMetrics(portfolio).stocks} stocks</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Value</p>
                  <p className="text-2xl font-bold">₹{getPortfolioMetrics(portfolio).value.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Return</p>
                  <p className={`text-xl font-bold ${getPortfolioMetrics(portfolio).returnPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {getPortfolioMetrics(portfolio).returnPct >= 0 ? "+" : ""}
                    {getPortfolioMetrics(portfolio).returnPct.toFixed(2)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/portfolio/${portfolio.id}/add-stock`)}
                className="mt-4 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm font-medium"
              >
                Add Stock
              </button>
              <button
                onClick={() => navigate(`/portfolio/${portfolio.id}/holdings`)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 hover:bg-white/10 text-sm font-medium"
              >
                View Stocks
              </button>
            </motion.div>
          ))}

          {/* Create New Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -5 }}
            onClick={handleAddPortfolio}
            className="p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-green-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[240px]"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Plus size={32} className="text-green-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Create New Portfolio</h3>
            <p className="text-sm text-gray-400">Track a new set of stocks</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
