import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-9xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
        >
          404
        </motion.h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2"
            >
              <Home size={20} />
              Go to Dashboard
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 font-medium flex items-center gap-2 hover:bg-white/10"
          >
            <ArrowLeft size={20} />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
