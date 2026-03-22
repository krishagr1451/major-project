import { motion } from "motion/react";
import { Bell, Plus, TrendingUp, TrendingDown, Volume2, Target, Trash2, Edit } from "lucide-react";
import { useState } from "react";

const alerts = [
  {
    id: 1,
    type: "price",
    symbol: "AAPL",
    condition: "Price above ₹180",
    currentValue: "₹178.45",
    target: "₹180.00",
    status: "active",
    triggered: false,
    icon: TrendingUp,
    color: "green",
  },
  {
    id: 2,
    type: "rsi",
    symbol: "TSLA",
    condition: "RSI below 30",
    currentValue: "45.2",
    target: "30",
    status: "active",
    triggered: false,
    icon: Target,
    color: "blue",
  },
  {
    id: 3,
    type: "volume",
    symbol: "NVDA",
    condition: "Volume surge > 2x avg",
    currentValue: "45.6M",
    target: "80M",
    status: "active",
    triggered: false,
    icon: Volume2,
    color: "purple",
  },
  {
    id: 4,
    type: "price",
    symbol: "AMD",
    condition: "Price below ₹175",
    currentValue: "₹178.23",
    target: "₹175.00",
    status: "triggered",
    triggered: true,
    icon: TrendingDown,
    color: "red",
  },
];

const recentNotifications = [
  {
    title: "AAPL Price Alert",
    message: "Apple Inc. crossed ₹180 - Target reached!",
    time: "2 minutes ago",
    type: "success",
  },
  {
    title: "TSLA RSI Oversold",
    message: "Tesla RSI dropped to 28.4 - Potential buy signal",
    time: "15 minutes ago",
    type: "info",
  },
  {
    title: "Market Opening",
    message: "US Markets opened - Scanner activated",
    time: "1 hour ago",
    type: "info",
  },
];

export default function Alerts() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Alerts & Notifications</h1>
          <p className="text-gray-400">
            Stay updated with custom alerts and market notifications
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          Create Alert
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Alerts", value: "12", color: "green" },
          { label: "Triggered Today", value: "5", color: "blue" },
          { label: "Pending", value: "7", color: "yellow" },
          { label: "Total Created", value: "34", color: "purple" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <h2 className="text-xl font-bold mb-6">Active Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`p-5 rounded-xl border transition-all group ${
                  alert.triggered
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-white/5 border-white/10 hover:border-green-500/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg bg-${alert.color}-500/20 flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`text-${alert.color}-400`} size={24} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{alert.symbol}</h3>
                        <p className="text-gray-400 text-sm">{alert.condition}</p>
                      </div>
                      {alert.triggered && (
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Triggered
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Current</p>
                        <p className="font-semibold">{alert.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Target</p>
                        <p className="font-semibold text-green-400">{alert.target}</p>
                      </div>
                      <div className="flex-1" />
                      {/* Progress Bar */}
                      <div className="flex-1 max-w-xs">
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${alert.color}-500`}
                            style={{ width: alert.triggered ? "100%" : "65%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30"
                    >
                      <Edit size={18} className="text-blue-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Notifications</h2>
          <button className="text-sm text-blue-400 hover:text-blue-300">Mark all as read</button>
        </div>
        <div className="space-y-3">
          {recentNotifications.map((notification, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-start gap-3"
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === "success" ? "bg-green-500" : "bg-blue-500"
                }`}
              />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{notification.title}</h4>
                <p className="text-sm text-gray-400 mb-1">{notification.message}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
              <Bell size={16} className="text-gray-400" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Alert Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
      >
        <h2 className="text-xl font-bold mb-4">Quick Alert Templates</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Price Breakout", desc: "Alert when price breaks resistance" },
            { name: "RSI Extremes", desc: "Overbought/Oversold conditions" },
            { name: "Volume Spike", desc: "Unusual volume activity" },
          ].map((template, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-all"
            >
              <p className="font-semibold mb-1">{template.name}</p>
              <p className="text-sm text-gray-400">{template.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
