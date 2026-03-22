import { motion } from "motion/react";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { marketAPI, portfoliosAPI } from "../../utils/api";
import { getPortfolioMetrics, loadPortfolios, normalizePortfolios, savePortfolios, type PortfolioRecord } from "../../utils/portfolios";

export default function PortfolioHoldings() {
  const navigate = useNavigate();
  const { portfolioId } = useParams();
  const [portfolio, setPortfolio] = useState<PortfolioRecord | null>(null);

  useEffect(() => {
    const localRows = loadPortfolios();
    const localFound = localRows.find((row) => row.id === portfolioId) || null;
    setPortfolio(localFound);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    portfoliosAPI
      .getAll()
      .then((response) => {
        const cloudRows = normalizePortfolios((response?.data || []).map((row: any) => row?.metadata || row));
        if (!cloudRows.length) {
          return;
        }
        savePortfolios(cloudRows);
        const found = cloudRows.find((row) => row.id === portfolioId) || null;
        setPortfolio(found);
      })
      .catch(() => {
      });
  }, [portfolioId]);

  useEffect(() => {
    if (!portfolio) {
      return;
    }

    let active = true;

    const refresh = async () => {
      const nextHoldings = await Promise.all(
        portfolio.holdings.map(async (holding) => {
          const symbol = String(holding.symbol || "").toUpperCase().trim();
          const initialExchange = String(holding.exchange || "nse");
          const stripped = symbol.replace(/(\.NS|\.BO)$/i, "");

          const candidates = [
            { symbol, exchange: initialExchange },
            { symbol: stripped, exchange: "us" },
            { symbol: stripped, exchange: "nse" },
            { symbol: stripped, exchange: "bse" },
          ];

          for (const candidate of candidates) {
            try {
              const response = await marketAPI.getQuote(candidate.symbol, candidate.exchange);
              const quote = response?.data?.quote || {};
              const current = Number(quote.c ?? 0);
              if (!current || Number.isNaN(current)) {
                continue;
              }

              return {
                ...holding,
                symbol: String(response?.data?.symbol || candidate.symbol).toUpperCase(),
                exchange: String(response?.data?.exchange || candidate.exchange),
                price: current,
                change: Number(quote.d ?? holding.change ?? 0),
                changePercent: Number(quote.dp ?? holding.changePercent ?? 0),
                sparkline: [...(holding.sparkline || []), current].slice(-20),
              };
            } catch {
            }
          }

          return holding;
        })
      );

      if (!active) {
        return;
      }

      const updated: PortfolioRecord = {
        ...portfolio,
        holdings: nextHoldings,
      };

      setPortfolio(updated);
    };

    refresh();
    const timer = setInterval(refresh, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [portfolio]);

  const metrics = useMemo(() => {
    return portfolio ? getPortfolioMetrics(portfolio) : { stocks: 0, value: 0, returnPct: 0 };
  }, [portfolio]);

  if (!portfolio) {
    return (
      <div className="p-6">
        <p className="text-gray-400 mb-3">Portfolio not found.</p>
        <button
          onClick={() => navigate("/portfolio")}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
        >
          Back to Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold">{portfolio.name}</h1>
          <p className="text-gray-400 text-sm">Stocks: {metrics.stocks} • Value: ₹{metrics.value.toLocaleString()}</p>
        </div>
        <button
          onClick={() => navigate("/portfolio")}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft size={16} />
        </button>
      </motion.div>

      <div className="space-y-3">
        {portfolio.holdings.length === 0 && (
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-center">
            No stocks added yet.
          </div>
        )}

        {portfolio.holdings.map((holding, index) => {
          const invested = Number(holding.avgPrice || 0) * Number(holding.quantity || 0);
          const currentValue = Number(holding.price || 0) * Number(holding.quantity || 0);
          const pnl = currentValue - invested;
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

          return (
            <motion.div
              key={`${holding.symbol}-${index}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{holding.symbol}</p>
                  <p className="text-sm text-gray-400">{holding.name}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Buy Price</p>
                  <p className="font-semibold">₹{Number(holding.avgPrice || 0).toFixed(2)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Current Price</p>
                  <p className="font-semibold">₹{Number(holding.price || 0).toFixed(2)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Quantity</p>
                  <p className="font-semibold">{Number(holding.quantity || 0)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">P/L</p>
                  <p className={`font-semibold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                  </p>
                  <p className={`text-xs ${pnlPct >= 0 ? "text-green-400" : "text-red-400"} flex items-center justify-end gap-1`}>
                    {pnlPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
