import { motion } from "motion/react";
import { X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export default function QuickBacktestButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const value = localStorage.getItem("quickBacktestHidden");
    if (value === "1") {
      setHidden(true);
    }
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          localStorage.setItem("quickBacktestHidden", "1");
          setHidden(true);
        }}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background/95 border border-white/20 hover:bg-white/10 flex items-center justify-center"
        aria-label="Dismiss quick backtest"
      >
        <X size={14} />
      </button>

      <Link to="/backtest">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 shadow-xl shadow-green-500/30 flex items-center justify-center group"
        >
          <Zap className="text-white group-hover:rotate-12 transition-transform" size={28} />
        </motion.button>
      </Link>
    </div>
  );
}
