import { motion } from "motion/react";
import { Link } from "react-router";
import {
  TrendingUp,
  BarChart3,
  Activity,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const chartData = Array.from({ length: 50 }, (_, i) => ({
  value: 1000 + Math.random() * 500 * Math.sin(i / 5) + i * 20,
}));

const features = [
  {
    icon: Activity,
    title: "Multiple Strategies",
    description: "SMA, RSI, Momentum, Mean Reversion, and more",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Deep insights into Sharpe, drawdown, and returns",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get intelligent recommendations for your strategies",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Advanced risk metrics and position sizing",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Quantitative Trader",
    content: "BacktestPro helped me validate my strategies before going live. The insights are invaluable!",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Portfolio Manager",
    content: "Best backtesting platform I've used. The UI is clean and the analytics are comprehensive.",
    rating: 5,
  },
  {
    name: "Emma Thompson",
    role: "Day Trader",
    content: "The strategy comparison feature saved me thousands. Highly recommend!",
    rating: 5,
  },
];

const stats = [
  { value: "10M+", label: "Backtests Run" },
  { value: "50K+", label: "Active Traders" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl">BacktestPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-semibold"
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background Chart */}
        <div className="absolute inset-0 opacity-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Backtest Trading Strategies Like a Pro
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Validate your trading ideas with professional-grade analytics. Test multiple strategies,
              analyze performance, and make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-semibold text-lg flex items-center gap-2 justify-center"
                >
                  Upload Data
                  <ArrowRight size={20} />
                </motion.button>
              </Link>
              <Link to="/backtest">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 font-semibold text-lg flex items-center gap-2 justify-center hover:bg-white/10 transition-colors"
                >
                  <Zap size={20} />
                  Run Backtest
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#0f0f17]/50 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </h3>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-400 text-lg">Everything you need to backtest like a professional</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <Icon className="text-green-400" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-[#0f0f17]/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Trusted by Traders Worldwide</h2>
            <p className="text-gray-400 text-lg">See what our users have to say</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 backdrop-blur-xl"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Start Backtesting?</h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of traders making smarter decisions with data
            </p>
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-semibold text-lg"
              >
                Get Started Free
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0f0f17]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-gray-400">
            <p>© 2026 BacktestPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}