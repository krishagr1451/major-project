import { motion } from "motion/react";
import { BookOpen, Video, FileText, Award, Clock, TrendingUp } from "lucide-react";

const courses = [
  {
    title: "Introduction to Backtesting",
    description: "Learn the fundamentals of backtesting trading strategies",
    duration: "2 hours",
    lessons: 8,
    level: "Beginner",
    icon: BookOpen,
    color: "green",
    progress: 0,
  },
  {
    title: "Technical Analysis Mastery",
    description: "Master technical indicators and chart patterns",
    duration: "4 hours",
    lessons: 12,
    level: "Intermediate",
    icon: TrendingUp,
    color: "blue",
    progress: 45,
  },
  {
    title: "Risk Management Strategies",
    description: "Protect your capital with proven risk management techniques",
    duration: "3 hours",
    lessons: 10,
    level: "Intermediate",
    icon: Award,
    color: "purple",
    progress: 0,
  },
  {
    title: "Advanced Strategy Development",
    description: "Create sophisticated trading strategies from scratch",
    duration: "6 hours",
    lessons: 15,
    level: "Advanced",
    icon: FileText,
    color: "yellow",
    progress: 0,
  },
];

const articles = [
  {
    title: "Understanding Sharpe Ratio",
    category: "Risk Metrics",
    readTime: "5 min",
    author: "Dr. James Wilson",
  },
  {
    title: "How to Interpret Drawdown",
    category: "Performance",
    readTime: "7 min",
    author: "Sarah Chen",
  },
  {
    title: "Best Practices for Backtesting",
    category: "Methodology",
    readTime: "10 min",
    author: "Mike Johnson",
  },
  {
    title: "Common Backtesting Pitfalls",
    category: "Tips & Tricks",
    readTime: "8 min",
    author: "Emma Davis",
  },
];

export default function Learn() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Learning Center</h1>
        <p className="text-gray-400">
          Master trading strategies with our comprehensive courses and resources
        </p>
      </motion.div>

      {/* Progress Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold mb-1">Your Learning Progress</h2>
            <p className="text-gray-400">Keep going! You're making great progress</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-400">23%</p>
            <p className="text-sm text-gray-400">Complete</p>
          </div>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "23%" }}
            transition={{ delay: 0.3, duration: 1 }}
            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
          />
        </div>
      </motion.div>

      {/* Courses */}
      <div>
        <h2 className="text-xl font-bold mb-4">Courses</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course, index) => {
            const Icon = course.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-${course.color}-500/20 flex items-center justify-center`}
                  >
                    <Icon className={`text-${course.color}-400`} size={24} />
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      course.level === "Beginner"
                        ? "bg-green-500/20 text-green-400"
                        : course.level === "Intermediate"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {course.level}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{course.description}</p>
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Video size={16} />
                    {course.lessons} lessons
                  </div>
                </div>
                {course.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold text-green-400">{course.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2 rounded-lg font-medium ${
                    course.progress > 0
                      ? "bg-gradient-to-r from-green-500 to-blue-500"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {course.progress > 0 ? "Continue Learning" : "Start Course"}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-xl font-bold mb-4">Featured Articles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                  {article.category}
                </span>
                <span className="text-xs text-gray-400">{article.readTime}</span>
              </div>
              <h3 className="font-semibold mb-2">{article.title}</h3>
              <p className="text-sm text-gray-400">by {article.author}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Video Tutorials */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center"
      >
        <Video className="mx-auto mb-4 text-purple-400" size={48} />
        <h2 className="text-2xl font-bold mb-2">Video Tutorials</h2>
        <p className="text-gray-400 mb-6">
          Watch step-by-step video guides on backtesting strategies
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-semibold"
        >
          Browse Videos
        </motion.button>
      </motion.div>
    </div>
  );
}
