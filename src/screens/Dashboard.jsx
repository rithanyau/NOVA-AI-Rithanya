import { useState } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Utensils,
  Brain,
  CalendarDays,
  Briefcase,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    title: "Study Planner",
    icon: BookOpen,
    color: "from-violet-500 to-purple-500",
    description:
      "Creates flexible study plans for exams, daily routines, assignments, revision, and long-term goals.",
    preview:
      "Ask NOVA to plan your day, week, semester, exam prep, revision cycle, or deadline strategy.",
  },
  {
    title: "Food Finder",
    icon: Utensils,
    color: "from-pink-500 to-rose-400",
    description:
      "Recommends food based on budget, mood, location, health goals, cravings, and available time.",
    preview:
      "Ask NOVA for quick bites, healthy meals, comfort food, cafés, budget spots, or post-class food plans.",
  },
  {
    title: "Stress Assistant",
    icon: Brain,
    color: "from-cyan-500 to-blue-500",
    description:
      "Supports students with stress reset, motivation, burnout control, focus help, and emotional check-ins.",
    preview:
      "Ask NOVA for calming routines, study pressure help, confidence boosts, or quick mental reset plans.",
  },
  {
    title: "Event Radar",
    icon: CalendarDays,
    color: "from-orange-400 to-pink-500",
    description:
      "Helps discover events, workshops, hackathons, club activities, competitions, and networking opportunities.",
    preview:
      "Ask NOVA to find events based on your interests, skills, goals, availability, or career direction.",
  },
  {
    title: "Career Guide",
    icon: Briefcase,
    color: "from-emerald-500 to-green-500",
    description:
      "Guides students across skills, internships, resumes, projects, interview prep, and career planning.",
    preview:
      "Ask NOVA for roadmaps, project ideas, resume improvements, placement prep, or career direction.",
  },
  {
    title: "Attendance AI",
    icon: ClipboardCheck,
    color: "from-fuchsia-500 to-violet-500",
    description:
      "Analyzes attendance, shortage risk, class planning, leave impact, and recovery strategies.",
    preview:
      "Ask NOVA how many classes to attend, what happens if you miss one, or how to recover attendance.",
  },
]

function Dashboard({ setScreen, setSelectedFeature }) {
  const [activeFeature, setActiveFeature] = useState(features[0])
  const ActiveIcon = activeFeature.icon

  return (
    <div className="min-h-screen bg-[#f7f4ff] overflow-hidden relative p-8 font-['Sora']">
      <div className="absolute top-[-150px] left-[-150px] w-[400px] h-[400px] bg-pink-300/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] bg-violet-300/30 rounded-full blur-[120px]" />

      <div className="relative z-10 flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            NOVA Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Your intelligent student survival system
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/50 border border-white/40 backdrop-blur-xl shadow-md">
          <Sparkles className="text-violet-500" size={18} />
          <span className="text-gray-700 font-medium">AI Active</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isActive = activeFeature.title === feature.title

            return (
              <motion.button
                key={index}
                onClick={() => setActiveFeature(feature)}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 220 }}
                className={`text-left group relative overflow-hidden rounded-[32px] bg-white/45 border backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ${
                  isActive ? "border-violet-300" : "border-white/40"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} ${
                    isActive
                      ? "opacity-10"
                      : "opacity-0 group-hover:opacity-10"
                  } transition-all duration-500`}
                />

                <div
                  className={`w-15 h-15 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="text-white" size={28} />
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-gray-800">
                  {feature.title}
                </h2>

                <p className="mt-3 text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          key={activeFeature.title}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[36px] bg-white/55 border border-white/50 backdrop-blur-2xl p-8 shadow-[0_12px_70px_rgba(0,0,0,0.08)]"
        >
          <div
            className={`absolute top-[-80px] right-[-80px] w-[220px] h-[220px] bg-gradient-to-br ${activeFeature.color} opacity-20 rounded-full blur-[70px]`}
          />

          <div
            className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${activeFeature.color} flex items-center justify-center shadow-xl`}
          >
            <ActiveIcon className="text-white" size={36} />
          </div>

          <h2 className="relative mt-8 text-4xl font-semibold tracking-[-2px] text-gray-900">
            {activeFeature.title}
          </h2>

          <p className="relative mt-4 text-gray-600 leading-relaxed text-lg">
            {activeFeature.preview}
          </p>

          <div className="relative mt-8 rounded-[28px] bg-white/60 border border-white/60 p-6">
            <p className="text-sm font-semibold text-violet-600 mb-2">
              Demo prompt
            </p>
            <p className="text-gray-700">
              “NOVA, help me with {activeFeature.title} in the smartest way
              possible.”
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedFeature(activeFeature)
              setScreen("feature")
            }}
            className="relative mt-8 w-full flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-medium shadow-[0_10px_40px_rgba(139,92,246,0.35)] hover:scale-[1.02] transition-all duration-300"
          >
            Open {activeFeature.title}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard