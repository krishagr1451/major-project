import { Bell, Search, User, Moon, Sun, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { authAPI } from "../../utils/api";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDark = (theme === "dark") || (theme === "system" && resolvedTheme === "dark");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Session cleared locally");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  // Get user from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <nav className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between gap-3">
      {/* Search */}
      <div className="hidden md:block flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search strategies, backtests..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto relative">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/alerts")}
          className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        </motion.button>

        {/* User Profile */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 p-1.5 pr-2 md:pr-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-400">Pro Trader</p>
            </div>
          </motion.button>

          {/* User Menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 bg-popover backdrop-blur-xl border border-border rounded-lg shadow-lg z-50 min-w-[200px]"
              >
                <div className="p-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="text-red-400" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}