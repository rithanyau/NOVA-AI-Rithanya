import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

function WelcomeScreen({ setScreen }) {
  return (
    <div className="relative h-screen overflow-hidden bg-[#f7f4ff] flex items-center justify-center font-['Sora']">

      {/* Animated Background Blobs */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute top-[-200px] left-[-150px] w-[500px] h-[500px] bg-pink-300/40 rounded-full blur-[140px]"
      />

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-violet-300/40 rounded-full blur-[140px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-200/30 rounded-full blur-[120px]"
      />

      {/* Floating Mini Elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="absolute top-[18%] left-[15%] w-6 h-6 rounded-full bg-pink-400/40 blur-sm"
      />

      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="absolute bottom-[20%] right-[18%] w-10 h-10 rounded-full bg-violet-400/30 blur-md"
      />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 w-[92%] max-w-[760px] rounded-[42px] border border-white/40 bg-white/30 backdrop-blur-2xl shadow-[0_8px_80px_rgba(0,0,0,0.08)] p-12 text-center overflow-hidden"
      >

        {/* Subtle Card Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/50 shadow-md mb-8"
        >
          <Sparkles size={16} className="text-violet-500" />

          <span className="text-sm font-medium text-gray-700">
            AI-Powered Student Companion
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-7xl md:text-8xl font-semibold tracking-[-5px] text-gray-900 leading-none"
        >
          NOVA
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-2xl text-violet-600 font-medium"
        >
          survive college intelligently
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-gray-600 leading-relaxed text-lg max-w-[560px] mx-auto"
        >
          Your AI-powered student survival system —
          helping manage academics, deadlines, attendance,
          stress, food spots, events, and productivity
          with intelligent assistance.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >

          {/* Launch Button */}
          <button
            onClick={() => setScreen("dashboard")}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-medium shadow-[0_10px_40px_rgba(139,92,246,0.4)] hover:scale-105 hover:shadow-[0_15px_50px_rgba(139,92,246,0.5)] transition-all duration-300"
          >
            Launch Assistant
          </button>

          {/* Secondary Button */}
          <button className="px-8 py-4 rounded-full bg-white/70 border border-white/60 text-gray-700 font-medium hover:bg-white hover:scale-105 transition-all duration-300">
            Explore Features
          </button>

        </motion.div>

      </motion.div>
    </div>
  )
}

export default WelcomeScreen