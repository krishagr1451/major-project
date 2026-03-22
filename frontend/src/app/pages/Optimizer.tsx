import { motion } from "motion/react";
import { Zap, Play, TrendingUp, Award, Settings } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const optimizationResults = [
  { params: "SMA(10,30)", sharpe: 1.89, return: 28.4, drawdown: -15.2 },
  { params: "SMA(15,40)", sharpe: 2.12, return: 31.7, drawdown: -12.8 },
  { params: "SMA(20,50)", sharpe: 2.43, return: 34.2, drawdown: -11.5 },
  { params: "SMA(25,60)", sharpe: 2.28, return: 32.1, drawdown: -13.1 },
  { params: "SMA(30,70)", sharpe: 1.95, return: 29.8, drawdown: -14.6 },
];

const heatmapData = [
  { short: 10, long20: 1.2, long30: 1.5, long40: 1.8, long50: 2.1, long60: 1.9 },
  { short: 15, long20: 1.4, long30: 1.7, long40: 2.0, long50: 2.3, long60: 2.1 },
  { short: 20, long20: 1.6, long30: 1.9, long40: 2.2, long50: 2.5, long60: 2.3 },
  { short: 25, long20: 1.5, long30: 1.8, long40: 2.1, long50: 2.4, long60: 2.2 },
  { short: 30, long20: 1.3, long30: 1.6, long40: 1.9, long50: 2.2, long60: 2.0 },
];

export default function Optimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setShowResults(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Strategy Optimizer</h1>
        <p className="text-gray-400">
          Find optimal parameters for your trading strategies using advanced algorithms
        </p>
      </motion.div>

      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Settings className="text-purple-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Optimization Settings</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Strategy Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Strategy to Optimize</label>
            <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50">
              <option>SMA Crossover</option>
              <option>RSI Strategy</option>
              <option>Momentum Trading</option>
              <option>Mean Reversion</option>
            </select>
          </div>

          {/* Optimization Metric */}
          <div>
            <label className="block text-sm font-medium mb-2">Optimization Metric</label>
            <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50">
              <option>Sharpe Ratio</option>
              <option>Total Return</option>
              <option>Profit Factor</option>
              <option>Risk-Adjusted Return</option>
            </select>
          </div>

          {/* Short SMA Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Short SMA Range</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Min (5)"
                defaultValue="5"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="Max (30)"
                defaultValue="30"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="Step (5)"
                defaultValue="5"
                className="w-24 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          {/* Long SMA Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Long SMA Range</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Min (20)"
                defaultValue="20"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="Max (100)"
                defaultValue="100"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="Step (10)"
                defaultValue="10"
                className="w-24 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
          <p className="text-blue-400 font-medium mb-1">Optimization Method: Grid Search</p>
          <p className="text-gray-400">
            Testing all parameter combinations within the specified ranges. Estimated runtime: 2-3 minutes
          </p>
        </div>
      </motion.div>

      {/* Run Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runOptimization}
          disabled={isOptimizing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isOptimizing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap size={24} />
              </motion.div>
              Optimizing... {Math.floor(Math.random() * 40 + 60)}%
            </>
          ) : (
            <>
              <Play size={24} />
              Run Optimization
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Results */}
      {showResults && (
        <>
          {/* Best Parameters */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <Award size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">Optimal Parameters Found!</h2>
                <p className="text-gray-400">Best performance: SMA(20, 50)</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
                <p className="text-4xl font-bold text-green-400">2.43</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Total Return</p>
                <p className="text-2xl font-bold text-green-400">+34.2%</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-400">-11.5%</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-blue-400">68.7%</p>
              </div>
            </div>
          </motion.div>

          {/* Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <h2 className="text-xl font-bold mb-6">Optimization Results (Top 5)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Parameters</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Sharpe</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Return</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Drawdown</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResults.map((result, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className={`border-b border-white/5 hover:bg-white/5 ${
                        index === 2 ? "bg-green-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 2
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                              : "bg-white/10"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold">{result.params}</td>
                      <td className="px-4 py-4 text-right font-bold text-blue-400">
                        {result.sharpe.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-400">
                        +{result.return}%
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-red-400">
                        {result.drawdown}%
                      </td>
                      <td className="px-4 py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-sm font-medium"
                        >
                          Use This
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Performance Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <h2 className="text-xl font-bold mb-6">Sharpe Ratio Heatmap</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-sm text-gray-400">Short/Long</th>
                    <th className="p-3 text-center text-sm text-gray-400">20</th>
                    <th className="p-3 text-center text-sm text-gray-400">30</th>
                    <th className="p-3 text-center text-sm text-gray-400">40</th>
                    <th className="p-3 text-center text-sm text-gray-400">50</th>
                    <th className="p-3 text-center text-sm text-gray-400">60</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-3 text-sm font-medium">{row.short}</td>
                      {["long20", "long30", "long40", "long50", "long60"].map((key, colIndex) => {
                        const value = row[key as keyof typeof row] as number;
                        const intensity = Math.min(value / 2.5, 1);
                        const isOptimal = value >= 2.4;
                        return (
                          <td key={colIndex} className="p-3">
                            <div
                              className={`p-3 rounded-lg text-center ${
                                isOptimal ? "ring-2 ring-green-500" : ""
                              }`}
                              style={{
                                backgroundColor: `rgba(34, 197, 94, ${intensity * 0.5})`,
                              }}
                            >
                              <span className="text-sm font-semibold">{value.toFixed(2)}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
