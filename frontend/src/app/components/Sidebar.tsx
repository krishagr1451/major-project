import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Upload,
  Activity,
  BarChart3,
  Brain,
  Settings,
  TrendingUp,
  Menu,
  X,
  Briefcase,
  GitCompare,
  Radar,
  Bell,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Portfolio", path: "/portfolio" },
  { icon: Upload, label: "Upload Data", path: "/upload" },
  { icon: Activity, label: "Backtest", path: "/backtest" },
  { icon: BarChart3, label: "Results", path: "/results" },
  { icon: GitCompare, label: "Comparison", path: "/comparison" },
  { icon: Brain, label: "Insights", path: "/insights" },
  { icon: Radar, label: "Scanner", path: "/scanner" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: Zap, label: "Optimizer", path: "/optimizer" },
  { icon: TrendingUp, label: "Strategies", path: "/strategies" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10"
      >
        {isCollapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        } fixed md:relative z-40 w-64 h-screen bg-[#0f0f17]/80 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 shadow-2xl md:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg">BacktestPro</h1>
                <p className="text-xs text-gray-400">Strategy Analytics</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
              <p className="text-xs text-gray-400">Pro Plan</p>
              <p className="text-sm font-semibold text-white">Unlimited Backtests</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        />
      )}
    </>
  );
}