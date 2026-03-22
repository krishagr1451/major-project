import { motion } from "motion/react";
import { TrendingUp, Activity, Target, Zap, Star, Lock } from "lucide-react";

const strategies = [
  {
    name: "SMA Crossover",
    description: "Uses moving average crossovers to identify trend changes",
    difficulty: "Beginner",
    winRate: 68.7,
    avgReturn: 2.3,
    timeframe: "Medium-term",
    icon: TrendingUp,
    color: "green",
    isPremium: false,
  },
  {
    name: "RSI Strategy",
    description: "Trades based on overbought and oversold RSI signals",
    difficulty: "Beginner",
    winRate: 72.4,
    avgReturn: 1.8,
    timeframe: "Short-term",
    icon: Activity,
    color: "blue",
    isPremium: false,
  },
  {
    name: "Momentum Trading",
    description: "Follows strong price momentum and volume trends",
    difficulty: "Intermediate",
    winRate: 65.2,
    avgReturn: 3.1,
    timeframe: "Short-term",
    icon: Zap,
    color: "purple",
    isPremium: false,
  },
  {
    name: "Mean Reversion",
    description: "Exploits temporary price deviations from the mean",
    difficulty: "Intermediate",
    winRate: 70.1,
    avgReturn: 2.0,
    timeframe: "Medium-term",
    icon: Target,
    color: "yellow",
    isPremium: false,
  },
  {
    name: "Pairs Trading",
    description: "Trade correlated assets to profit from divergence",
    difficulty: "Advanced",
    winRate: 74.5,
    avgReturn: 2.8,
    timeframe: "Medium-term",
    icon: TrendingUp,
    color: "pink",
    isPremium: true,
  },
  {
    name: "ML-Based Strategy",
    description: "Machine learning powered predictive trading",
    difficulty: "Advanced",
    winRate: 78.3,
    avgReturn: 3.5,
    timeframe: "Any",
    icon: Activity,
    color: "cyan",
    isPremium: true,
  },
];

export default function Strategies() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Strategy Library</h1>
        <p className="text-gray-400">
          Explore and test proven trading strategies
        </p>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 flex-wrap"
      >
        {["All", "Beginner", "Intermediate", "Advanced"].map((filter, index) => (
          <motion.button
            key={filter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg ${
              index === 0
                ? "bg-gradient-to-r from-green-500 to-blue-500"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </motion.div>

      {/* Strategy Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy, index) => {
          const Icon = strategy.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
            >
              {strategy.isPremium && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center gap-1">
                  <Lock size={12} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">PRO</span>
                </div>
              )}
              <div
                className={`w-12 h-12 rounded-lg bg-${strategy.color}-500/20 flex items-center justify-center mb-4`}
              >
                <Icon className={`text-${strategy.color}-400`} size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{strategy.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{strategy.description}</p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    strategy.difficulty === "Beginner"
                      ? "bg-green-500/20 text-green-400"
                      : strategy.difficulty === "Intermediate"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {strategy.difficulty}
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                  {strategy.timeframe}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="font-semibold text-green-400">{strategy.winRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Return</span>
                  <span className="font-semibold text-blue-400">+{strategy.avgReturn}%</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-2 rounded-lg font-medium ${
                  strategy.isPremium
                    ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"
                    : "bg-gradient-to-r from-green-500 to-blue-500"
                }`}
                onClick={() =>
                  !strategy.isPremium && (window.location.href = "/backtest")
                }
              >
                {strategy.isPremium ? "Upgrade to Use" : "Use Strategy"}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Create Custom Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center"
      >
        <Star className="mx-auto mb-4 text-purple-400" size={48} />
        <h2 className="text-2xl font-bold mb-2">Create Custom Strategy</h2>
        <p className="text-gray-400 mb-6">
          Build your own strategy using our advanced editor
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-semibold"
        >
          Start Building
        </motion.button>
      </motion.div>
    </div>
  );
}
