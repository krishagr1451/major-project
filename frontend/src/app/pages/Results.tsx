import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Download,
  Share2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "react-router";

type TradeRow = {
  id: number;
  entryDate: string;
  exitDate: string;
  type: string;
  entryPrice: number | null;
  exitPrice: number | null;
  shares: number | null;
  pnl: number;
  return: number;
};

export default function Results() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"equity" | "trades" | "metrics">("equity");
  const [latestResult, setLatestResult] = useState<any>(null);

  useEffect(() => {
    const fromNavigation = (location.state as any)?.backtestResult;
    if (fromNavigation?.success && fromNavigation?.isRealBacktestRun === true) {
      setLatestResult(fromNavigation);
      localStorage.setItem("latestRealBacktestResult", JSON.stringify(fromNavigation));
      return;
    }

    try {
      const raw = localStorage.getItem("latestRealBacktestResult");
      if (!raw) {
        setLatestResult(null);
        return;
      }

      const stored = JSON.parse(raw);
      if (stored?.success && stored?.isRealBacktestRun === true) {
        setLatestResult(stored);
      } else {
        setLatestResult(null);
      }
    } catch {
      setLatestResult(null);
    }
  }, [location.state]);

  const resultStats = latestResult?.stats;
  const resultMeta = latestResult?.meta;
  const resultRequest = latestResult?.request;
  const hasLiveResult = Boolean(
    latestResult?.success &&
      latestResult?.isRealBacktestRun === true &&
      (Array.isArray(latestResult?.equity) || Array.isArray(latestResult?.trades) || resultStats)
  );

  const equityCurveData =
    latestResult?.equity?.length > 0
      ? latestResult.equity.map((point: any) => ({
          date: point.date,
          equity: point.equity,
          benchmark: latestResult.equity[0]?.equity ?? point.equity,
        }))
      : [];

  const trades: TradeRow[] = hasLiveResult
    ? (latestResult.trades || []).map((trade: any, index: number) => {
        const rawReturn = Number(trade.returnPct ?? 0);
        const normalizedReturn = Math.abs(rawReturn) <= 1 ? rawReturn * 100 : rawReturn;
        return {
          id: index + 1,
          entryDate: trade.entry || "-",
          exitDate: trade.exit || "-",
          type: String(trade.type || "Trade"),
          entryPrice: Number.isFinite(Number(trade.entryPrice)) ? Number(trade.entryPrice) : null,
          exitPrice: Number.isFinite(Number(trade.exitPrice)) ? Number(trade.exitPrice) : null,
          shares: Number.isFinite(Number(trade.shares)) ? Number(trade.shares) : null,
          pnl: Number(trade.pnl ?? 0),
          return: normalizedReturn,
        };
      })
    : [];

  const pnlDistribution =
    trades.length > 0
      ? trades.map((trade: any, index: number) => ({
          trade: `T${index + 1}`,
          pnl: Number(trade.pnl ?? 0),
        }))
      : [];

  const performanceMetrics = resultStats
    ? [
        { label: "Total Return", value: `${Number(resultStats.return || 0).toFixed(2)}%`, positive: Number(resultStats.return || 0) >= 0 },
        { label: "Sharpe Ratio", value: Number(resultStats.sharpe || 0).toFixed(2), positive: Number(resultStats.sharpe || 0) >= 0 },
        { label: "Total Trades", value: `${Number(resultStats.trades || 0)}`, positive: Number(resultStats.trades || 0) > 0 },
        { label: "Final Equity", value: `₹${Number(resultStats.finalEquity || 0).toLocaleString()}`, positive: true },
      ]
    : [];

  const riskMetrics = resultStats
    ? [
        { label: "Max Drawdown", value: `${Number(resultStats.maxDrawdown || 0).toFixed(2)}%`, positive: false },
        { label: "Sharpe Ratio", value: Number(resultStats.sharpe || 0).toFixed(2), positive: Number(resultStats.sharpe || 0) >= 0 },
      ]
    : [];

  const winningTrades = trades.filter((trade: any) => Number(trade.pnl || 0) > 0);
  const losingTrades = trades.filter((trade: any) => Number(trade.pnl || 0) < 0);
  const avgWin = winningTrades.length
    ? winningTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl || 0), 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length
    ? losingTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl || 0), 0) / losingTrades.length
    : 0;

  const tradeMetrics = hasLiveResult
    ? [
        { label: "Total Trades", value: `${trades.length}` },
        { label: "Winning Trades", value: `${winningTrades.length}${trades.length ? ` (${((winningTrades.length / trades.length) * 100).toFixed(1)}%)` : ""}` },
        { label: "Losing Trades", value: `${losingTrades.length}${trades.length ? ` (${((losingTrades.length / trades.length) * 100).toFixed(1)}%)` : ""}` },
        { label: "Avg Win", value: winningTrades.length ? `₹${avgWin.toFixed(0)}` : "-" },
        { label: "Avg Loss", value: losingTrades.length ? `₹${avgLoss.toFixed(0)}` : "-" },
      ]
    : [];

  const tradeDurations = trades
    .map((trade: any) => {
      const entry = new Date(trade.entryDate);
      const exit = new Date(trade.exitDate);
      if (Number.isNaN(entry.getTime()) || Number.isNaN(exit.getTime())) {
        return null;
      }
      return Math.max(0, Math.round((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24)));
    })
    .filter((duration: number | null): duration is number => duration !== null);

  const avgTradeDuration =
    tradeDurations.length > 0
      ? `${(tradeDurations.reduce((sum: number, duration: number) => sum + duration, 0) / tradeDurations.length).toFixed(1)} days`
      : "-";

  const longestStreak = (target: "win" | "loss") => {
    let longest = 0;
    let current = 0;

    for (const trade of trades) {
      const isWin = Number(trade.pnl || 0) > 0;
      const match = target === "win" ? isWin : !isWin;
      if (match) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  };

  const grossProfit = winningTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl || 0), 0);
  const grossLossAbs = Math.abs(losingTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl || 0), 0));
  const netProfit = grossProfit - grossLossAbs;
  const initialCapital = Number(resultRequest?.cash || 0);
  const maxDrawdownPctAbs = Math.abs(Number(resultStats?.maxDrawdown || 0));
  const maxDrawdownAmount = initialCapital > 0 ? (maxDrawdownPctAbs / 100) * initialCapital : 0;

  const timeMetrics = hasLiveResult
    ? [
        { label: "Avg Trade Duration", value: avgTradeDuration },
        { label: "Longest Win Streak", value: `${longestStreak("win")} trades` },
        { label: "Longest Loss Streak", value: `${longestStreak("loss")} trades` },
        { label: "Profit Factor", value: grossLossAbs > 0 ? (grossProfit / grossLossAbs).toFixed(2) : "-" },
        { label: "Recovery Factor", value: maxDrawdownAmount > 0 ? (netProfit / maxDrawdownAmount).toFixed(2) : "-" },
      ]
    : [];

  const metrics = resultStats
    ? [
        {
          title: "Total Return",
          value: `${resultStats.return >= 0 ? "+" : ""}${Number(resultStats.return || 0).toFixed(2)}%`,
          change: `From ₹${Number(resultRequest?.cash || 100000).toLocaleString()}`,
          icon: TrendingUp,
          color: "green",
          positive: Number(resultStats.return || 0) >= 0,
        },
        {
          title: "Sharpe Ratio",
          value: Number(resultStats.sharpe || 0).toFixed(2),
          change: "Risk-adjusted",
          icon: Activity,
          color: "blue",
          positive: Number(resultStats.sharpe || 0) >= 0,
        },
        {
          title: "Max Drawdown",
          value: `${Number(resultStats.maxDrawdown || 0).toFixed(2)}%`,
          change: "Peak to trough",
          icon: TrendingDown,
          color: "red",
          positive: false,
        },
        {
          title: "Final Equity",
          value: `₹${Number(resultStats.finalEquity || 0).toLocaleString()}`,
          change: `${Number(resultStats.finalEquity || 0) - Number(resultRequest?.cash || 100000) >= 0 ? "+" : ""}₹${(Number(resultStats.finalEquity || 0) - Number(resultRequest?.cash || 100000)).toLocaleString()} profit`,
          icon: DollarSign,
          color: "green",
          positive: Number(resultStats.finalEquity || 0) >= Number(resultRequest?.cash || 100000),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Backtest Results</h1>
          <p className="text-gray-400">
            {resultRequest?.strategy ? String(resultRequest.strategy).toUpperCase() : "-"} • {resultRequest?.symbol ? String(resultRequest.symbol).toUpperCase() : "-"} • {resultRequest?.startDate || "-"} - {resultRequest?.endDate || "-"}
            {resultMeta?.dataSource ? ` • ${String(resultMeta.dataSource).toUpperCase()}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Share2 size={18} />
            Share
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </motion.button>
        </div>
      </motion.div>

      {!hasLiveResult && (
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300">
          No completed real backtest found. Run a real backtest first to view results.
        </div>
      )}

      {/* Metrics Cards */}
      {hasLiveResult && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg bg-${metric.color}-500/20 flex items-center justify-center`}
                >
                  <Icon className={`text-${metric.color}-400`} size={20} />
                </div>
              </div>
              <p className="text-sm text-gray-400">{metric.change}</p>
            </motion.div>
          );
        })}
      </div>}

      {/* Tabs */}
      {hasLiveResult && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 border-b border-white/10"
      >
        {[
          { id: "equity", label: "Equity Curve" },
          { id: "trades", label: "Trades" },
          { id: "metrics", label: "Metrics" },
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
      </motion.div>}

      {/* Equity Curve Tab */}
      {hasLiveResult && activeTab === "equity" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Chart */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Equity Curve</h2>
                <p className="text-sm text-gray-400">Strategy vs Buy & Hold Benchmark</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Strategy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Benchmark</span>
                </div>
              </div>
            </div>
            {equityCurveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  interval={19}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a24",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorEquity)"
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorBenchmark)"
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">No equity curve returned by this backtest run.</div>
            )}
          </div>

          {/* PnL Distribution */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Profit & Loss Distribution</h2>
            {pnlDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pnlDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="trade" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a24",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => `₹${value.toFixed(0)}`}
                />
                <Bar
                  dataKey="pnl"
                  radius={[4, 4, 0, 0]}
                >
                  {pnlDistribution.map((item, index) => (
                    <Cell key={`pnl-cell-${index}`} fill={item.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">No trade P&L data returned by this backtest run.</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Trades Tab */}
      {hasLiveResult && activeTab === "trades" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Trade History</h2>
            <span className="text-sm text-gray-400">{trades.length} trades</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                    Entry Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                    Exit Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Exit</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">P&L</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                    Return
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-400 text-center" colSpan={8}>
                      No trades generated for this run.
                    </td>
                  </tr>
                )}
                {trades.map((trade: TradeRow, index: number) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm">{trade.entryDate}</td>
                    <td className="px-4 py-4 text-sm">{trade.exitDate}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-right">{trade.entryPrice !== null ? `₹${trade.entryPrice.toFixed(2)}` : "-"}</td>
                    <td className="px-4 py-4 text-sm text-right">{trade.exitPrice !== null ? `₹${trade.exitPrice.toFixed(2)}` : "-"}</td>
                    <td className="px-4 py-4 text-sm text-right">{trade.shares !== null ? trade.shares : "-"}</td>
                    <td
                      className={`px-4 py-4 text-sm text-right font-semibold ${
                        trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      ₹{trade.pnl.toFixed(0)}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm text-right font-semibold ${
                        trade.return >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {trade.return >= 0 ? "+" : ""}
                      {trade.return.toFixed(2)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Metrics Tab */}
      {hasLiveResult && activeTab === "metrics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Performance Metrics */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Performance Metrics</h2>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <span className="text-gray-300">{metric.label}</span>
                  <span
                    className={`font-semibold ${
                      metric.positive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {metric.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Risk Metrics</h2>
            <div className="space-y-4">
              {riskMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <span className="text-gray-300">{metric.label}</span>
                  <span
                    className={`font-semibold ${
                      metric.positive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {metric.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trade Statistics */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Trade Statistics</h2>
            <div className="space-y-4">
              {tradeMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <span className="text-gray-300">{metric.label}</span>
                  <span className="font-semibold text-white">{metric.value}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Time Statistics */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Time Statistics</h2>
            <div className="space-y-4">
              {timeMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <span className="text-gray-300">{metric.label}</span>
                  <span className="font-semibold text-white">{metric.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
