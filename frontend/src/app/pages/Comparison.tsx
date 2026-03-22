import { motion } from "motion/react";
import { Eye, GitCompare, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { useNavigate } from "react-router";
import { backtestsAPI } from "../../utils/api";
import { toast } from "sonner";

type StrategyConfig = {
  id: string;
  name: string;
  color: string;
};

type BacktestRow = {
  id?: string;
  symbol?: string;
  strategy?: string;
  start_date?: string;
  end_date?: string;
  initial_capital?: number;
  parameters?: Record<string, unknown>;
  stats?: {
    return?: number;
    sharpe?: number;
    maxDrawdown?: number;
    trades?: number;
    finalEquity?: number;
  };
  equity?: Array<{ date: string; equity: number }>;
  equity_curve?: Array<{ date: string; equity: number }>;
  trades?: Array<{ pnl?: number; entry?: string; exit?: string; returnPct?: number }>;
  created_at?: string;
};

const strategyConfigs: StrategyConfig[] = [
  { id: "buy-hold", name: "Buy & Hold", color: "#14b8a6" },
  { id: "sma-cross", name: "SMA Crossover", color: "#22c55e" },
  { id: "long-short", name: "Long/Short SMA", color: "#f97316" },
  { id: "rsi", name: "RSI Strategy", color: "#3b82f6" },
  { id: "momentum", name: "Momentum Trading", color: "#a855f7" },
  { id: "mean-reversion", name: "Mean Reversion", color: "#eab308" },
];

const strategyAliases: Record<string, string> = {
  buy_hold: "buy-hold",
  sma: "sma-cross",
  sma_cross: "sma-cross",
  long_short: "long-short",
  mean_reversion: "mean-reversion",
};

const normalizeStrategyId = (value?: string) => {
  const strategy = String(value || "").trim().toLowerCase();
  if (!strategy) {
    return "";
  }
  return strategyAliases[strategy] || strategy.replace(/_/g, "-");
};

export default function Comparison() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [latestByStrategy, setLatestByStrategy] = useState<Record<string, BacktestRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBacktests = async () => {
      setLoading(true);
      const localRows = (() => {
        try {
          const raw = localStorage.getItem("savedBacktestsLocal");
          if (!raw) {
            return [] as BacktestRow[];
          }
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as BacktestRow[]) : ([] as BacktestRow[]);
        } catch {
          return [] as BacktestRow[];
        }
      })();

      try {
        const response = await backtestsAPI.getAll();
        const cloudRows = (response?.data || []) as BacktestRow[];
        const rows = [...cloudRows, ...localRows];
        const latest: Record<string, BacktestRow> = {};

        for (const row of rows) {
          const strategy = normalizeStrategyId(row.strategy);
          if (!strategy) {
            continue;
          }

          const current = latest[strategy];
          const currentTs = current?.created_at ? Date.parse(current.created_at) : 0;
          const nextTs = row?.created_at ? Date.parse(row.created_at) : 0;

          if (!current || nextTs >= currentTs) {
            latest[strategy] = { ...row, strategy };
          }
        }

        const availableIds = strategyConfigs
          .filter((config) => latest[config.id])
          .map((config) => config.id);

        setLatestByStrategy(latest);
        setSelectedIds(availableIds.slice(0, 3));
      } catch {
        const latest: Record<string, BacktestRow> = {};
        for (const row of localRows) {
          const strategy = normalizeStrategyId(row.strategy);
          if (!strategy) {
            continue;
          }
          const current = latest[strategy];
          const currentTs = current?.created_at ? Date.parse(current.created_at) : 0;
          const nextTs = row?.created_at ? Date.parse(row.created_at) : 0;
          if (!current || nextTs >= currentTs) {
            latest[strategy] = { ...row, strategy };
          }
        }

        const availableIds = strategyConfigs
          .filter((config) => latest[config.id])
          .map((config) => config.id);

        setLatestByStrategy(latest);
        setSelectedIds(availableIds.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    loadBacktests();
  }, []);

  const availableStrategies = useMemo(
    () => strategyConfigs.filter((config) => latestByStrategy[config.id]),
    [latestByStrategy]
  );

  const selected = useMemo(
    () => availableStrategies.filter((strategy) => selectedIds.includes(strategy.id)),
    [availableStrategies, selectedIds]
  );

  const toggleStrategy = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }

    if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteStrategyResult = async (strategyId: string) => {
    const confirmed = window.confirm("Delete all saved results for this strategy?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await backtestsAPI.getAll();
      const cloudRows = (response?.data || []) as BacktestRow[];
      const matching = cloudRows.filter((row) => normalizeStrategyId(row.strategy) === strategyId && row.id);

      if (matching.length > 0) {
        await Promise.all(matching.map((row) => backtestsAPI.delete(String(row.id))));
      }
    } catch {
      toast.error("Could not delete strategy results from cloud");
      return;
    }

    try {
      const raw = localStorage.getItem("savedBacktestsLocal");
      const existing = raw ? JSON.parse(raw) : [];
      const rows = Array.isArray(existing) ? existing : [];
      const next = rows.filter((row: BacktestRow) => normalizeStrategyId(row.strategy) !== strategyId);
      localStorage.setItem("savedBacktestsLocal", JSON.stringify(next));
    } catch {
    }

    setLatestByStrategy((prev) => {
      const next = { ...prev };
      delete next[strategyId];
      return next;
    });
    setSelectedIds((prev) => prev.filter((id) => id !== strategyId));
    toast.success("Strategy result deleted");
  };

  const handleViewStrategyResult = (strategyId: string) => {
    const row = latestByStrategy[strategyId];
    if (!row) {
      toast.error("No result available for this strategy");
      return;
    }

    const backtestResult = {
      success: true,
      isRealBacktestRun: true,
      stats: row.stats || {},
      equity: row.equity_curve || row.equity || [],
      trades: row.trades || [],
      request: {
        strategy: strategyId,
        symbol: row.symbol || "-",
        startDate: row.start_date || "-",
        endDate: row.end_date || "-",
        cash: row.initial_capital || 0,
        parameters: row.parameters || {},
      },
      meta: {
        dataSource: "saved",
      },
    };

    navigate("/results", { state: { backtestResult } });
  };

  const equityData = useMemo(() => {
    if (!selected.length) {
      return [];
    }

    const curves = selected.map((strategy) => {
      const row = latestByStrategy[strategy.id];
      const curve = row?.equity_curve || row?.equity || [];
      return Array.isArray(curve) ? curve : [];
    });
    const maxLength = curves.reduce((max, curve) => Math.max(max, curve.length), 0);

    return Array.from({ length: maxLength }, (_, index) => {
      const firstPoint: any = curves[0]?.[index];
      const row: Record<string, string | number> = {
        day: String(firstPoint?.date || firstPoint?.datetime || `D${index + 1}`),
      };

      selected.forEach((strategy, strategyIndex) => {
        const point: any = curves[strategyIndex]?.[index];
        const equityValue = Number(point?.equity ?? point?.value ?? NaN);
        row[strategy.id] = Number.isFinite(equityValue) ? equityValue : null;
      });

      return row;
    });
  }, [selected, latestByStrategy]);

  const metricRows = useMemo(() => {
    const getValues = (strategyId: string) => {
      const row = latestByStrategy[strategyId] || {};
      const stats = row.stats || {};
      const trades = row.trades || [];
      const winning = trades.filter((trade) => Number(trade.pnl || 0) > 0);
      const losing = trades.filter((trade) => Number(trade.pnl || 0) < 0);
      const grossProfit = winning.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
      const grossLoss = Math.abs(losing.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0));
      const avgWin = winning.length ? grossProfit / winning.length : 0;
      const avgLoss = losing.length ? losing.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0) / losing.length : 0;
      const winRate = trades.length ? (winning.length / trades.length) * 100 : 0;

      return {
        totalReturn: `${Number(stats.return || 0).toFixed(2)}%`,
        sharpe: Number(stats.sharpe || 0).toFixed(2),
        maxDrawdown: `${Number(stats.maxDrawdown || 0).toFixed(2)}%`,
        totalTrades: `${Number(stats.trades || 0)}`,
        finalEquity: `₹${Number(stats.finalEquity || 0).toLocaleString()}`,
        avgWin: winning.length ? `₹${avgWin.toFixed(0)}` : "-",
        avgLoss: losing.length ? `₹${avgLoss.toFixed(0)}` : "-",
        winRate: `${winRate.toFixed(1)}%`,
        profitFactor: grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "-",
      };
    };

    return [
      { label: "Total Return", key: "totalReturn" },
      { label: "Sharpe Ratio", key: "sharpe" },
      { label: "Win Rate", key: "winRate" },
      { label: "Max Drawdown", key: "maxDrawdown" },
      { label: "Total Trades", key: "totalTrades" },
      { label: "Final Equity", key: "finalEquity" },
      { label: "Avg Win", key: "avgWin" },
      { label: "Avg Loss", key: "avgLoss" },
      { label: "Profit Factor", key: "profitFactor" },
    ].map((row) => ({
      ...row,
      values: Object.fromEntries(
        selected.map((strategy) => {
          const values = getValues(strategy.id);
          return [strategy.id, values[row.key as keyof typeof values]];
        })
      ),
    }));
  }, [selected, latestByStrategy]);

  const radarData = useMemo(() => {
    const clamp = (value: number) => Math.max(0, Math.min(100, value));

    const scoreFor = (strategyId: string) => {
      const stats = latestByStrategy[strategyId]?.stats || {};
      const trades = latestByStrategy[strategyId]?.trades || [];
      const winning = trades.filter((trade) => Number(trade.pnl || 0) > 0).length;
      const winRate = trades.length ? (winning / trades.length) * 100 : 0;

      return {
        Returns: clamp(((Number(stats.return || 0) + 20) / 70) * 100),
        Consistency: clamp(((Number(stats.sharpe || 0) + 1) / 3) * 100),
        "Risk Control": clamp(100 - Math.abs(Number(stats.maxDrawdown || 0)) * 3),
        "Win Rate": clamp(winRate),
        Recovery: clamp(((Number(stats.return || 0) - Math.abs(Number(stats.maxDrawdown || 0)) + 20) / 70) * 100),
      };
    };

    const categories = ["Returns", "Consistency", "Risk Control", "Win Rate", "Recovery"];
    return categories.map((category) => {
      const row: Record<string, string | number> = { category };
      selected.forEach((strategy) => {
        row[strategy.id] = scoreFor(strategy.id)[category as keyof ReturnType<typeof scoreFor>];
      });
      return row;
    });
  }, [selected, latestByStrategy]);

  const bestStrategy = useMemo(() => {
    if (!selected.length) {
      return null;
    }

    const scored = selected.map((strategy) => {
      const stats = latestByStrategy[strategy.id]?.stats || {};
      const score = Number(stats.return || 0) + Number(stats.sharpe || 0) * 10 - Math.abs(Number(stats.maxDrawdown || 0));
      return {
        name: strategy.name,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score)[0];
  }, [selected, latestByStrategy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Strategy Comparison</h1>
          <p className="text-gray-400">Compare your real backtest results side-by-side</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <GitCompare size={16} />
          <span>{selected.length} of 4 strategies selected</span>
        </div>
      </motion.div>

      {/* Strategy Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-lg font-bold mb-4">Select Strategies to Compare</h2>
        {loading && <p className="text-sm text-gray-400 mb-4">Loading backtests...</p>}
        {!loading && availableStrategies.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">No saved backtests found. Run backtests first, then compare here.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {availableStrategies.map((strategy) => {
            const isSelected = selectedIds.includes(strategy.id);
            return (
              <motion.div
                key={strategy.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleStrategy(strategy.id)}
                className={`p-4 rounded-lg border transition-all min-h-[132px] flex flex-col justify-between ${
                  isSelected
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                } cursor-pointer`}
              >
                <div className="flex items-center justify-end mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isSelected ? "bg-green-500" : "bg-white/20 border border-white/20"}`}>
                    {isSelected ? (
                      <X size={12} className="text-white" />
                    ) : (
                      <Plus size={12} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="w-full text-left flex-1">
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: strategy.color }}
                />
                <p className="font-medium text-sm">{strategy.name}</p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleViewStrategyResult(strategy.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 text-xs text-blue-300 whitespace-nowrap"
                  >
                    <Eye size={12} />
                    View Results
                  </button>

                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDeleteStrategyResult(strategy.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-xs text-red-300 whitespace-nowrap"
                    title="Delete this strategy result"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

          {selected.length > 0 && (
            <>
              {/* Equity Curve Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6">Equity Curve Comparison</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a24",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => (value != null ? `₹${Number(value).toLocaleString()}` : "-")}
                    />
                    <Legend />
                    {selected.map((strategy) => (
                      <Line
                        key={strategy.id}
                        type="monotone"
                        dataKey={strategy.id}
                        stroke={strategy.color}
                        strokeWidth={2}
                        name={strategy.name}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Performance Radar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6">Performance Radar</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="category" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a24",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    {selected.map((strategy) => (
                      <Radar
                        key={strategy.id}
                        name={strategy.name}
                        dataKey={strategy.id}
                        stroke={strategy.color}
                        fill={strategy.color}
                        fillOpacity={0.3}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Metrics Comparison Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6">Metrics Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Metric</th>
                        {selected.map((strategy) => (
                          <th
                            key={strategy.id}
                            className="px-4 py-3 text-right text-sm font-medium"
                            style={{ color: strategy.color }}
                          >
                            {strategy.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metricRows.map((row, index) => (
                        <motion.tr
                          key={row.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="px-4 py-4 text-sm font-medium">{row.label}</td>
                          {selected.map((strategy) => (
                            <td
                              key={strategy.id}
                              className="px-4 py-4 text-sm text-right font-semibold"
                            >
                              {row.values[strategy.id] ?? "-"}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Winner Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <GitCompare size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Best Overall Strategy</h3>
                    <p className="text-gray-400">
                      Based on risk-adjusted return and drawdown
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">{bestStrategy?.name || "-"}</p>
                    <p className="text-sm text-gray-400">
                      Score: {bestStrategy ? Math.round(bestStrategy.score) : "-"}/100
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}

    </div>
  );
}
