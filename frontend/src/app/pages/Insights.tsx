import { motion } from "motion/react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Shield,
  Award,
  Activity,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const strategyComparison = [
  { strategy: "Consistency", sma: 85, rsi: 72, momentum: 68, meanRev: 79 },
  { strategy: "Returns", sma: 78, rsi: 85, momentum: 90, meanRev: 65 },
  { strategy: "Risk Control", sma: 82, rsi: 75, momentum: 60, meanRev: 88 },
  { strategy: "Drawdown", sma: 80, rsi: 70, momentum: 65, meanRev: 85 },
  { strategy: "Win Rate", sma: 75, rsi: 82, momentum: 70, meanRev: 78 },
];

const heatmapData = [
  { month: "Jan", week1: 2.3, week2: 1.8, week3: -0.5, week4: 3.2 },
  { month: "Feb", week1: 1.5, week2: 2.7, week3: 1.2, week4: -1.0 },
  { month: "Mar", week1: 3.1, week2: 0.8, week3: 2.5, week4: 1.9 },
  { month: "Apr", week1: -0.8, week2: 2.4, week3: 3.5, week4: 1.1 },
  { month: "May", week1: 2.8, week2: 1.3, week3: -0.3, week4: 2.6 },
  { month: "Jun", week1: 1.9, week2: 3.4, week3: 2.1, week4: 0.7 },
];

const performanceTimeline = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    i
  ],
  performance: 70 + Math.random() * 25,
}));

const insights = [
  {
    icon: Brain,
    title: "Best Performing Strategy",
    description: "SMA Crossover shows the highest risk-adjusted returns",
    highlight: "34.2% return with 2.43 Sharpe ratio",
    color: "green",
    score: 95,
  },
  {
    icon: Shield,
    title: "Risk Level Analysis",
    description: "Your portfolio maintains moderate risk exposure",
    highlight: "Max drawdown of 12.8% is within acceptable range",
    color: "blue",
    score: 82,
  },
  {
    icon: AlertTriangle,
    title: "Drawdown Warning",
    description: "Strategy showed 3 consecutive losses in May",
    highlight: "Consider implementing stop-loss at -15%",
    color: "yellow",
    score: 68,
  },
  {
    icon: Target,
    title: "Win Rate Optimization",
    description: "68.7% win rate indicates solid strategy selection",
    highlight: "Focus on increasing average win size",
    color: "purple",
    score: 88,
  },
];

const badges = [
  { icon: Award, label: "Consistent Trader", color: "green" },
  { icon: Zap, label: "Quick Analyzer", color: "yellow" },
  { icon: Shield, label: "Risk Manager", color: "blue" },
  { icon: TrendingUp, label: "Profit Master", color: "purple" },
];

export default function Insights() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Advanced Insights</h1>
        <p className="text-gray-400">AI-powered analysis of your trading strategies</p>
      </motion.div>

      {/* Strategy Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/20 backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="text-green-400" size={32} />
              <h2 className="text-2xl font-bold">Strategy Performance Score</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Based on risk-adjusted returns, consistency, and drawdown management
            </p>
            <div className="flex gap-3">
              {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${badge.color}-500/20 border border-${badge.color}-500/30`}
                  >
                    <Icon className={`text-${badge.color}-400`} size={16} />
                    <span className="text-sm font-medium">{badge.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <svg width="180" height="180" className="transform -rotate-90">
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#ffffff10"
                strokeWidth="12"
              />
              <motion.circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - 0.87) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">87</span>
              <span className="text-sm text-gray-400">out of 100</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${insight.color}-500/20 flex items-center justify-center`}
                >
                  <Icon className={`text-${insight.color}-400`} size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insight.score}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className={`h-full bg-${insight.color}-500`}
                    />
                  </div>
                  <span className="text-sm font-semibold">{insight.score}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{insight.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{insight.description}</p>
              <div
                className={`p-3 rounded-lg bg-${insight.color}-500/10 border border-${insight.color}-500/20`}
              >
                <p className="text-sm font-medium">{insight.highlight}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strategy Comparison Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-6">Strategy Comparison Analysis</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={strategyComparison}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="strategy" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis stroke="#9ca3af" />
              <Radar
                name="SMA Crossover"
                dataKey="sma"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
              <Radar
                name="RSI Strategy"
                dataKey="rsi"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Radar
                name="Momentum"
                dataKey="momentum"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.3}
              />
              <Radar
                name="Mean Reversion"
                dataKey="meanRev"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a24",
                  border: "1px solid #ffffff20",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Strategy Rankings</h3>
              {[
                { name: "SMA Crossover", score: 80, color: "green" },
                { name: "RSI Strategy", score: 77, color: "blue" },
                { name: "Mean Reversion", score: 79, color: "yellow" },
                { name: "Momentum", score: 71, color: "purple" },
              ]
                .sort((a, b) => b.score - a.score)
                .map((strategy, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-2"
                  >
                    <span
                      className={`w-8 h-8 rounded-full bg-${strategy.color}-500/20 flex items-center justify-center text-sm font-bold`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{strategy.name}</p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${strategy.score}%` }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                          className={`h-full bg-${strategy.color}-500`}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{strategy.score}</span>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-6">Performance Timeline</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={performanceTimeline}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a24",
                border: "1px solid #ffffff20",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="performance"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#perfGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Returns Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-6">Monthly Returns Heatmap</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm text-gray-400">Month</th>
                <th className="p-3 text-center text-sm text-gray-400">Week 1</th>
                <th className="p-3 text-center text-sm text-gray-400">Week 2</th>
                <th className="p-3 text-center text-sm text-gray-400">Week 3</th>
                <th className="p-3 text-center text-sm text-gray-400">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-3 text-sm font-medium">{row.month}</td>
                  {["week1", "week2", "week3", "week4"].map((week, colIndex) => {
                    const value = row[week as keyof typeof row] as number;
                    const isPositive = value >= 0;
                    const intensity = Math.min(Math.abs(value) / 3.5, 1);
                    return (
                      <motion.td
                        key={colIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + rowIndex * 0.1 + colIndex * 0.05 }}
                        className="p-3 text-center"
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            isPositive
                              ? `bg-green-500/[${intensity * 0.5}]`
                              : `bg-red-500/[${intensity * 0.5}]`
                          }`}
                          style={{
                            backgroundColor: isPositive
                              ? `rgba(34, 197, 94, ${intensity * 0.5})`
                              : `rgba(239, 68, 68, ${intensity * 0.5})`,
                          }}
                        >
                          <span
                            className={`text-sm font-semibold ${
                              isPositive ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {value >= 0 ? "+" : ""}
                            {value.toFixed(1)}%
                          </span>
                        </div>
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
      >
        <div className="flex items-start gap-4">
          <Activity className="text-purple-400 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">AI Recommendations</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Consider combining SMA Crossover with RSI for better entry timing
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Implement trailing stop-loss to protect profits during volatile periods
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Your win rate is strong - focus on letting winners run longer
                </span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
