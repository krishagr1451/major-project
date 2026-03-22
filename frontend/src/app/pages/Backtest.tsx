import { motion } from "motion/react";
import { Play, Settings, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authAPI, backtestsAPI } from "../../utils/api";
import { useNavigate, useSearchParams } from "react-router";

const strategies = [
  { value: "buy-hold", label: "Buy & Hold" },
  { value: "sma-cross", label: "SMA Crossover" },
  { value: "long-short", label: "Long/Short SMA" },
  { value: "rsi", label: "RSI Strategy" },
  { value: "momentum", label: "Momentum Trading" },
  { value: "mean-reversion", label: "Mean Reversion" },
];

export default function Backtest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [strategy, setStrategy] = useState("sma-cross");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [dataSource, setDataSource] = useState("market");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2026-02-27");
  const [initialCapital, setInitialCapital] = useState("100000");
  const [commission, setCommission] = useState(0.1);
  const [slippageBps, setSlippageBps] = useState(5);
  const [spreadBps, setSpreadBps] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  // Strategy-specific parameters
  const [smaShort, setSmaShort] = useState(20);
  const [smaLong, setSmaLong] = useState(50);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [rsiOversold, setRsiOversold] = useState(30);

  useEffect(() => {
    const qpSymbol = searchParams.get("symbol");
    const qpDataSource = searchParams.get("dataSource");
    const qpJustUploaded = searchParams.get("justUploaded");

    if (qpSymbol) {
      setSymbol(qpSymbol.toUpperCase());
    }
    if (qpDataSource) {
      setDataSource(qpDataSource);
    }

    if (qpJustUploaded === "1") {
      setDataSource("csv");
    }

    try {
      const raw = localStorage.getItem("latestUploadedCsv");
      if (!raw) {
        return;
      }
      const latest = JSON.parse(raw);
      if (latest?.symbol) {
        setSymbol(String(latest.symbol).toUpperCase());
      }
      if (latest?.minDate && latest?.maxDate) {
        setStartDate(String(latest.minDate));
        setEndDate(String(latest.maxDate));
      }
      setDataSource("csv");
    } catch {
    }
  }, [searchParams]);

  const handleRunBacktest = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required to run and save backtests in Supabase");
      navigate("/login");
      return;
    }

    try {
      await authAPI.getCurrentUser(token);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    setIsRunning(true);

    const payload = {
      symbol,
      dataSource,
      strategy,
      startDate,
      endDate,
      cash: parseFloat(initialCapital),
      commission: commission / 100,
      slippageBps,
      spreadBps,
      parameters: {
        smaShort,
        smaLong,
        rsiPeriod,
        rsiOverbought,
        rsiOversold,
      },
    };

    try {
      const response = await backtestsAPI.run(payload);
      const savedAt = new Date().toISOString();
      const liveResult = {
        ...response,
        request: payload,
        savedAt,
        isRealBacktestRun: true,
      };
      localStorage.setItem("latestRealBacktestResult", JSON.stringify(liveResult));

      let savedToCloud = true;
      try {
        await backtestsAPI.create({
          symbol: payload.symbol,
          strategy: payload.strategy,
          startDate: payload.startDate,
          endDate: payload.endDate,
          cash: payload.cash,
          commission: payload.commission,
          stats: response?.stats || {},
          equity: response?.equity || [],
          trades: response?.trades || [],
          parameters: {
            ...payload.parameters,
            slippageBps: payload.slippageBps,
            spreadBps: payload.spreadBps,
          },
        });
      } catch (saveError) {
        savedToCloud = false;
        const message = saveError instanceof Error ? saveError.message : "Unknown save error";

        if (/invalid token|missing access token|401|token/i.test(message)) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          toast.error("Backtest ran, but your session expired. Please login again to save results.");
        } else {
          toast.error(`Backtest ran, but save failed: ${message}`);
        }
      }

      if (savedToCloud) {
        toast.success(`Backtest completed using ${response?.meta?.dataSource || dataSource} data!`);
      }
      setTimeout(() => {
        navigate("/results", { state: { backtestResult: liveResult } });
      }, 500);
    } catch (error) {
      console.error("Backtest error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Backtest failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Configure Backtest</h1>
        <p className="text-gray-400">Set up your strategy parameters and run the backtest</p>
      </motion.div>

      {/* Strategy Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <TrendingUp className="text-green-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Select Strategy</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {strategies.map((strat) => (
            <motion.button
              key={strat.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStrategy(strat.value)}
              className={`p-4 rounded-lg border transition-all text-left ${
                strategy === strat.value
                  ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <p className="font-medium">{strat.label}</p>
              <p className="text-sm text-gray-400 mt-1">
                {strat.value === "sma-cross" && "Uses moving average crossovers"}
                {strat.value === "long-short" && "Takes both long and short SMA crossover positions"}
                {strat.value === "rsi" && "Trades based on RSI signals"}
                {strat.value === "momentum" && "Follows price momentum"}
                {strat.value === "mean-reversion" && "Trades price reversions"}
                {strat.value === "buy-hold" && "Simple buy and hold"}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Basic Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Settings className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Basic Parameters</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="RELIANCE / RELIANCE.NS / AMZN"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Data Source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 [&>option]:bg-background [&>option]:text-foreground"
            >
              <option value="market">Realtime Server (Live API)</option>
              <option value="csv">CSV Only</option>
              <option value="auto">Auto (CSV then Live API)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar size={16} className="text-gray-400" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar size={16} className="text-gray-400" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          {/* Initial Capital */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <DollarSign size={16} className="text-gray-400" />
              Initial Capital
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          {/* Commission */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Commission (%)
              <span className="text-gray-400 font-normal">{commission}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={commission}
              onChange={(e) => setCommission(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Slippage (bps)
              <span className="text-gray-400 font-normal">{slippageBps} bps</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={slippageBps}
              onChange={(e) => setSlippageBps(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Spread (bps)
              <span className="text-gray-400 font-normal">{spreadBps} bps</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={spreadBps}
              onChange={(e) => setSpreadBps(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Strategy-Specific Parameters */}
      {strategy === "sma-cross" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <h2 className="text-xl font-bold mb-6">SMA Crossover Parameters</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Short SMA Period: {smaShort}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={smaShort}
                onChange={(e) => setSmaShort(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Long SMA Period: {smaLong}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={smaLong}
                onChange={(e) => setSmaLong(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {strategy === "rsi" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <h2 className="text-xl font-bold mb-6">RSI Strategy Parameters</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                RSI Period: {rsiPeriod}
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={rsiPeriod}
                onChange={(e) => setRsiPeriod(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Overbought: {rsiOverbought}
              </label>
              <input
                type="range"
                min="60"
                max="90"
                value={rsiOverbought}
                onChange={(e) => setRsiOverbought(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Oversold: {rsiOversold}
              </label>
              <input
                type="range"
                min="10"
                max="40"
                value={rsiOversold}
                onChange={(e) => setRsiOversold(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Run Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRunBacktest}
          disabled={isRunning}
          className="w-full p-6 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Settings size={24} />
              </motion.div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play size={24} />
              Run Backtest
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-gray-300"
      >
        <p className="font-medium text-blue-400 mb-1">💡 Pro Tip</p>
        <p>
          Start with a simple strategy like SMA Crossover to understand the basics. You can
          always run multiple backtests to compare different strategies.
        </p>
      </motion.div>
    </div>
  );
}