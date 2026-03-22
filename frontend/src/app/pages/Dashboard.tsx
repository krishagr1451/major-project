import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Target,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router";
import { toast } from "sonner";

const sparklineData = Array.from({ length: 20 }, (_, i) => ({
  value: 1000 + Math.random() * 500 + i * 30,
}));

const metrics = [
  {
    title: "Total Return",
    value: "+34.2%",
    change: "+5.2%",
    positive: true,
    icon: TrendingUp,
    color: "green",
  },
  {
    title: "Sharpe Ratio",
    value: "2.43",
    change: "+0.15",
    positive: true,
    icon: Activity,
    color: "blue",
  },
  {
    title: "Max Drawdown",
    value: "-12.8%",
    change: "-2.1%",
    positive: false,
    icon: TrendingDown,
    color: "red",
  },
  {
    title: "Final Equity",
    value: "₹134,250",
    change: "+₹24,250",
    positive: true,
    icon: DollarSign,
    color: "green",
  },
];

const recentActivity = [
  {
    strategy: "RSI Reversal",
    date: "2 hours ago",
    return: "+12.3%",
    positive: true,
  },
  {
    strategy: "SMA Crossover",
    date: "5 hours ago",
    return: "+8.7%",
    positive: true,
  },
  {
    strategy: "Momentum Trading",
    date: "1 day ago",
    return: "-3.2%",
    positive: false,
  },
  {
    strategy: "Mean Reversion",
    date: "2 days ago",
    return: "+15.8%",
    positive: true,
  },
  {
    strategy: "Breakout Strategy",
    date: "3 days ago",
    return: "+6.4%",
    positive: true,
  },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<"30D" | "90D" | "1Y">("30D");

  const rangeLabel = timeRange === "30D" ? "Last 30 Days" : timeRange === "90D" ? "Last 3 Months" : "Last 1 Year";

  const portfolioData = useMemo(() => {
    const points = timeRange === "30D" ? 30 : timeRange === "90D" ? 90 : 252;
    return Array.from({ length: points }, (_, i) => ({
      date: `Day ${i + 1}`,
      value: 100000 + Math.random() * 30000 + i * 250,
    }));
  }, [timeRange]);

  const handleExportReport = () => {
    try {
      const csvRows = ["date,value", ...portfolioData.map((point) => `${point.date},${point.value.toFixed(2)}`)];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dashboard-report-${timeRange.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Dashboard report exported");
    } catch {
      toast.error("Export failed");
    }
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
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's your trading overview.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "30D" | "90D" | "1Y")}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 3 Months</option>
            <option value="1Y">Last 1 Year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium"
            onClick={handleExportReport}
          >
            Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
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
              <div className="flex items-center gap-2">
                {metric.positive ? (
                  <ArrowUpRight className="text-green-400" size={16} />
                ) : (
                  <ArrowDownRight className="text-red-400" size={16} />
                )}
                <span
                  className={`text-sm ${
                    metric.positive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-gray-500 text-sm">vs last month</span>
              </div>
              <div className="mt-4 -mx-6 -mb-6">
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={metric.positive ? "#22c55e" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Portfolio Performance</h2>
              <p className="text-gray-400 text-sm">{rangeLabel} equity curve</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange("30D")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  timeRange === "30D"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                1M
              </button>
              <button
                onClick={() => setTimeRange("90D")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  timeRange === "90D"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                3M
              </button>
              <button
                onClick={() => setTimeRange("1Y")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  timeRange === "1Y"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                1Y
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <BarChart3 className="text-gray-400" size={20} />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{activity.strategy}</p>
                  <p className="text-xs text-gray-400">{activity.date}</p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    activity.positive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {activity.return}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
          >
            View All Activity
          </motion.button>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <h3 className="font-semibold">Win Rate</h3>
          </div>
          <p className="text-3xl font-bold mb-1">68.4%</p>
          <p className="text-sm text-gray-400">From 147 total trades</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity className="text-blue-400" size={20} />
            </div>
            <h3 className="font-semibold">Avg Trade</h3>
          </div>
          <p className="text-3xl font-bold mb-1">₹2,345</p>
          <p className="text-sm text-gray-400">Average profit per trade</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="text-purple-400" size={20} />
            </div>
            <h3 className="font-semibold">Total Strategies</h3>
          </div>
          <p className="text-3xl font-bold mb-1">12</p>
          <p className="text-sm text-gray-400">Active backtesting strategies</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link to="/backtest">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer"
            >
              <Zap className="text-green-400 mb-2" size={24} />
              <h3 className="font-semibold mb-1">New Backtest</h3>
              <p className="text-xs text-gray-400">Run a new strategy</p>
            </motion.div>
          </Link>

          <Link to="/optimizer">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <Target className="text-purple-400 mb-2" size={24} />
              <h3 className="font-semibold mb-1">Optimize</h3>
              <p className="text-xs text-gray-400">Find best parameters</p>
            </motion.div>
          </Link>

          <Link to="/scanner">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer"
            >
              <Activity className="text-blue-400 mb-2" size={24} />
              <h3 className="font-semibold mb-1">Scan Market</h3>
              <p className="text-xs text-gray-400">Find opportunities</p>
            </motion.div>
          </Link>

          <Link to="/comparison">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer"
            >
              <BarChart3 className="text-yellow-400 mb-2" size={24} />
              <h3 className="font-semibold mb-1">Compare</h3>
              <p className="text-xs text-gray-400">Strategy comparison</p>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Active Alerts Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-5 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Clock className="text-orange-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold mb-1">3 Active Alerts</h3>
            <p className="text-sm text-gray-400">AAPL, TSLA, NVDA approaching targets</p>
          </div>
        </div>
        <Link to="/alerts">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 font-medium"
          >
            View Alerts
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}