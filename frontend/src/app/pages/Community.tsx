import { motion } from "motion/react";
import { Users, TrendingUp, MessageCircle, Heart, Share2, Award } from "lucide-react";

const topTraders = [
  {
    rank: 1,
    name: "Sarah Chen",
    avatar: "SC",
    winRate: 78.5,
    totalReturn: 142.3,
    followers: 2345,
  },
  {
    rank: 2,
    name: "Mike Johnson",
    avatar: "MJ",
    winRate: 76.2,
    totalReturn: 135.7,
    followers: 1987,
  },
  {
    rank: 3,
    name: "Emma Davis",
    avatar: "ED",
    winRate: 74.8,
    totalReturn: 128.4,
    followers: 1654,
  },
];

const sharedStrategies = [
  {
    author: "David Park",
    strategy: "Advanced RSI Momentum",
    description: "Combines RSI with volume analysis for high-probability entries",
    likes: 234,
    comments: 45,
    return: 34.2,
    timeAgo: "2 hours ago",
  },
  {
    author: "Lisa Wong",
    strategy: "Multi-Timeframe SMA",
    description: "Uses multiple timeframes to confirm trend direction",
    likes: 189,
    comments: 32,
    return: 28.7,
    timeAgo: "5 hours ago",
  },
  {
    author: "Tom Anderson",
    strategy: "Breakout Scanner",
    description: "Identifies and trades key support/resistance breakouts",
    likes: 156,
    comments: 28,
    return: 31.5,
    timeAgo: "1 day ago",
  },
];

export default function Community() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-gray-400">
          Share strategies and learn from top traders worldwide
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Traders", value: "12.5K", icon: Users },
          { label: "Strategies Shared", value: "3.2K", icon: Share2 },
          { label: "Total Discussions", value: "8.7K", icon: MessageCircle },
          { label: "Community Rating", value: "4.8/5", icon: Award },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <Icon className="text-green-400 mb-2" size={20} />
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Top Traders Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-6">Top Traders This Month</h2>
        <div className="space-y-4">
          {topTraders.map((trader, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  trader.rank === 1
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                    : trader.rank === 2
                    ? "bg-gradient-to-br from-gray-300 to-gray-500"
                    : "bg-gradient-to-br from-orange-400 to-orange-600"
                }`}
              >
                {trader.rank}
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold">
                {trader.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{trader.name}</h3>
                <p className="text-sm text-gray-400">{trader.followers.toLocaleString()} followers</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Win Rate</p>
                <p className="font-semibold text-green-400">{trader.winRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Return</p>
                <p className="font-semibold text-blue-400">+{trader.totalReturn}%</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-sm font-medium"
              >
                Follow
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Shared Strategies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Shared Strategies</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-sm font-medium"
          >
            Share Your Strategy
          </motion.button>
        </div>
        {sharedStrategies.map((strategy, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-semibold">
                  {strategy.author[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{strategy.strategy}</h3>
                  <p className="text-sm text-gray-400">by {strategy.author} • {strategy.timeAgo}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold">
                +{strategy.return}%
              </span>
            </div>
            <p className="text-gray-300 mb-4">{strategy.description}</p>
            <div className="flex items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                <Heart size={18} />
                {strategy.likes}
              </motion.button>
              <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                <MessageCircle size={18} />
                {strategy.comments}
              </button>
              <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors">
                <Share2 size={18} />
                Share
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              >
                Try Strategy
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
