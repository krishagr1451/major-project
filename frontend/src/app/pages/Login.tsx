import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mail, Lock, User, TrendingUp, BarChart3, Activity } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../../utils/api";
import { useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    authAPI
      .getCurrentUser(token)
      .then((response) => {
        if (response?.success) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await authAPI.login(email, password);
        if (response.success) {
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        // Sign up
        const response = await authAPI.signup(email, password, name);
        if (response.success) {
          toast.success("Account created! Please log in.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      const message = error instanceof Error ? error.message : "Request failed";
      toast.error(message || (isLogin ? "Invalid credentials" : "Failed to create account"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="space-y-8">
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-3 mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">BacktestPro</h1>
                  <p className="text-gray-400 text-sm">Strategy Analysis Platform</p>
                </div>
              </motion.div>

              <h2 className="text-4xl font-bold mb-4">
                Professional Trading
                <br />
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Strategy Backtesting
                </span>
              </h2>
              <p className="text-gray-400 text-lg">
                Test your trading strategies with real historical data, advanced analytics, and
                institutional-grade tools.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  desc: "Deep insights with professional-grade metrics",
                },
                {
                  icon: Activity,
                  title: "Real-time Optimization",
                  desc: "Find the best parameters for your strategies",
                },
                {
                  icon: TrendingUp,
                  title: "Portfolio Management",
                  desc: "Track and optimize multiple strategies",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            {/* Toggle */}
            <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  isLogin
                    ? "bg-gradient-to-r from-green-500 to-blue-500"
                    : "hover:bg-white/5"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? "bg-gradient-to-r from-green-500 to-blue-500"
                    : "hover:bg-white/5"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (Sign Up Only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required={!isLogin}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              {/* Forgot Password (Login Only) */}
              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⚙️
                  </motion.div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>

            {/* Demo Account */}
            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-gray-300 text-center">
                <span className="font-medium text-blue-400">Demo Account:</span> demo@backtest.com
                / demo123
              </p>
            </div>

            {/* Social Login (Optional) */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#0a0a0a] text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </motion.button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <p className="text-center text-sm text-gray-400 mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-green-400 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-green-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
