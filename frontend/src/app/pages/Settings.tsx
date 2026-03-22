import { motion } from "motion/react";
import { User, Bell, Shield, Database, Moon, Sun, Trash2, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { authAPI, healthCheck } from "../../utils/api";

export default function Settings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string>("Never");

  const isDark = (theme === "dark") || (theme === "system" && resolvedTheme === "dark");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  useEffect(() => {
    const localRaw = localStorage.getItem("user");
    if (localRaw) {
      try {
        const localUser = JSON.parse(localRaw);
        const email = String(localUser?.email || "");
        const name = String(localUser?.user_metadata?.name || "");
        setProfileEmail(email);
        setProfileName(name || (email ? email.split("@")[0] : ""));
        setUsername(email ? `@${email.split("@")[0]}` : "");
      } catch {
      }
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      authAPI
        .getCurrentUser(token)
        .then((response) => {
          const user = response?.data?.user;
          if (!user) {
            return;
          }
          const email = String(user?.email || "");
          const name = String(user?.user_metadata?.name || "");
          setProfileEmail(email);
          setProfileName(name || (email ? email.split("@")[0] : ""));
          setUsername(email ? `@${email.split("@")[0]}` : "");
        })
        .catch(() => {
        });
    }

    healthCheck()
      .then(() => {
        setApiConnected(true);
        setLastSync(new Date().toLocaleTimeString());
      })
      .catch(() => {
        setApiConnected(false);
      });
  }, []);

  const connectionLabel = useMemo(() => (apiConnected ? "Connected" : "Disconnected"), [apiConnected]);
  const connectionColor = useMemo(() => (apiConnected ? "text-green-400" : "text-red-400"), [apiConnected]);
  const connectionDot = useMemo(() => (apiConnected ? "bg-green-500" : "bg-red-500"), [apiConnected]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <User className="text-green-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Profile Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={profileEmail}
              readOnly
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              readOnly
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium"
          >
            Save Changes
          </motion.button>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            {isDark ? <Moon className="text-purple-400" size={20} /> : <Sun className="text-yellow-400" size={20} />}
          </div>
          <h2 className="text-xl font-bold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-gray-400">Toggle dark/light theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full transition-colors ${
              isDark ? "bg-green-500" : "bg-white/20"
            } relative`}
          >
            <motion.div
              animate={{ x: isDark ? 24 : 2 }}
              className="w-6 h-6 rounded-full bg-white absolute top-1"
            />
          </button>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Bell className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-400">Receive real-time notifications</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-14 h-8 rounded-full transition-colors ${
                notifications ? "bg-green-500" : "bg-white/20"
              } relative`}
            >
              <motion.div
                animate={{ x: notifications ? 24 : 2 }}
                className="w-6 h-6 rounded-full bg-white absolute top-1"
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Updates</p>
              <p className="text-sm text-gray-400">Weekly performance summaries</p>
            </div>
            <button
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`w-14 h-8 rounded-full transition-colors ${
                emailUpdates ? "bg-green-500" : "bg-white/20"
              } relative`}
            >
              <motion.div
                animate={{ x: emailUpdates ? 24 : 2 }}
                className="w-6 h-6 rounded-full bg-white absolute top-1"
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* API Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Shield className="text-green-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">API Connection</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 mb-4">
          <div>
            <p className="font-medium">Connection Status</p>
            <p className="text-sm text-gray-400">Last synced: {lastSync}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionDot}`}></div>
            <span className={`text-sm font-medium ${connectionColor}`}>{connectionLabel}</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 font-medium"
        >
          Refresh Connection
        </motion.button>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <Database className="text-yellow-400" size={20} />
          </div>
          <h2 className="text-xl font-bold">Data Management</h2>
        </div>
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="text-blue-400" size={20} />
              <div className="text-left">
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-400">Download all your backtest results</p>
              </div>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="text-red-400" size={20} />
              <div className="text-left">
                <p className="font-medium text-red-400">Delete All Data</p>
                <p className="text-sm text-gray-400">Permanently remove all backtests</p>
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl bg-red-500/10 border border-red-500/20"
      >
        <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30"
        >
          Delete Account
        </motion.button>
      </motion.div>
    </div>
  );
}
