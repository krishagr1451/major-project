import { motion } from "motion/react";
import { Search, Filter, TrendingUp, AlertCircle, Play } from "lucide-react";
import { useState } from "react";

const scanResults = [
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 245.67,
    change: 3.45,
    volume: "98.7M",
    rsi: 72.4,
    sma20: "Above",
    pattern: "Bullish Flag",
    signal: "Strong Buy",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 178.23,
    change: 2.18,
    volume: "56.3M",
    rsi: 68.2,
    sma20: "Above",
    pattern: "Cup & Handle",
    signal: "Buy",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 892.34,
    change: 4.12,
    volume: "45.6M",
    rsi: 75.8,
    sma20: "Above",
    pattern: "Ascending Triangle",
    signal: "Strong Buy",
  },
];

const presetScans = [
  {
    name: "Momentum Breakout",
    description: "Stocks breaking above resistance with high volume",
    criteria: ["Price > SMA(20)", "Volume > 1.5x Avg", "RSI > 60"],
    color: "green",
  },
  {
    name: "Oversold Bounce",
    description: "Stocks in oversold territory ready to bounce",
    criteria: ["RSI < 30", "Price near support", "Volume increasing"],
    color: "blue",
  },
  {
    name: "Mean Reversion",
    description: "Stocks deviating from their average",
    criteria: ["Price < SMA(50)", "Bollinger Band touch", "Low volatility"],
    color: "purple",
  },
  {
    name: "High Volume Surge",
    description: "Unusual volume activity detected",
    criteria: ["Volume > 2x Avg", "Price momentum", "Gap up/down"],
    color: "yellow",
  },
];

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Market Scanner</h1>
        <p className="text-gray-400">
          Find trading opportunities using advanced technical filters
        </p>
      </motion.div>

      {/* Preset Scans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presetScans.map((scan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -5 }}
            className="p-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all cursor-pointer"
            onClick={runScan}
          >
            <div
              className={`w-10 h-10 rounded-lg bg-${scan.color}-500/20 flex items-center justify-center mb-3`}
            >
              <Search className={`text-${scan.color}-400`} size={20} />
            </div>
            <h3 className="font-bold mb-2">{scan.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{scan.description}</p>
            <div className="space-y-1">
              {scan.criteria.map((criterion, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  {criterion}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Scanner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Filter className="text-purple-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Custom Filters</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="Max"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          {/* Volume Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Min Volume</label>
            <input
              type="text"
              placeholder="e.g., 1M"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
            />
          </div>

          {/* RSI Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">RSI Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="30"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                placeholder="70"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          {/* Market Cap */}
          <div>
            <label className="block text-sm font-medium mb-2">Market Cap</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50">
              <option>Any</option>
              <option>Mega Cap (&gt; ₹200B)</option>
              <option>Large Cap (₹10B - ₹200B)</option>
              <option>Mid Cap (₹2B - ₹10B)</option>
              <option>Small Cap (&lt; ₹2B)</option>
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-medium mb-2">Sector</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50">
              <option>All Sectors</option>
              <option>Technology</option>
              <option>Healthcare</option>
              <option>Finance</option>
              <option>Energy</option>
            </select>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium mb-2">Chart Pattern</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500/50">
              <option>Any Pattern</option>
              <option>Bullish Flag</option>
              <option>Cup & Handle</option>
              <option>Head & Shoulders</option>
              <option>Triangle</option>
            </select>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runScan}
          disabled={isScanning}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Search size={20} />
              </motion.div>
              Scanning...
            </>
          ) : (
            <>
              <Play size={20} />
              Run Scan
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Scan Results */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Scan Results</h2>
              <p className="text-sm text-gray-400">{scanResults.length} matches found</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">
              Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Symbol</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Change</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Volume</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">RSI</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">SMA(20)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pattern</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Signal</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {scanResults.map((result, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold">{result.symbol}</p>
                        <p className="text-xs text-gray-400">{result.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">₹{result.price}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-green-400 font-semibold">+{result.change}%</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">{result.volume}</td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          result.rsi > 70 ? "text-red-400" : "text-gray-300"
                        }`}
                      >
                        {result.rsi}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                        {result.sma20}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">{result.pattern}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.signal === "Strong Buy"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {result.signal}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => (window.location.href = "/backtest")}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-xs font-medium"
                      >
                        Backtest
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Alert Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3"
      >
        <AlertCircle className="text-blue-400 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-400 mb-1">Scanner Updates</p>
          <p className="text-sm text-gray-400">
            Scans refresh every 5 minutes during market hours. Set up alerts to get notified when
            new opportunities match your criteria.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
