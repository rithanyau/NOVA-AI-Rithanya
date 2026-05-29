import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles, Send } from "lucide-react"

function FeatureScreen({ feature, setScreen }) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: "nova",
      text: `Hi, I’m NOVA. Ask me anything about ${feature.title}.`,
    },
  ])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const currentInput = input.trim()

    const userMessage = {
      sender: "user",
      text: currentInput,
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          feature: feature.title,
        }),
      })

      const data = await response.json()

      const novaMessage = {
        sender: "nova",
        text:
          data.reply ||
          "NOVA received your question, but I could not generate a proper reply.",
      }

      setMessages((prevMessages) => [...prevMessages, novaMessage])
    } catch (error) {
      const errorMessage = {
        sender: "nova",
        text: "Sorry, I couldn't connect to NOVA backend right now. Please check if the backend server is running on port 5000.",
      }

      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ff] relative overflow-hidden p-8 font-['Sora']">
      <div className="absolute top-[-120px] left-[-120px] w-[380px] h-[380px] bg-pink-300/25 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[380px] h-[380px] bg-violet-300/25 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-[1100px] mx-auto"
      >
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 border border-white/40 backdrop-blur-xl shadow-md hover:scale-105 transition-all"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 border border-white/40 backdrop-blur-xl shadow-md">
            <Sparkles size={18} className="text-violet-500" />
            <span className="text-gray-700 font-medium">NOVA Workspace</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">
          <div className="rounded-[40px] bg-white/50 border border-white/40 backdrop-blur-2xl p-10 shadow-[0_10px_70px_rgba(0,0,0,0.06)]">
            <h1 className="text-5xl font-semibold tracking-[-2px] text-gray-900">
              {feature.title}
            </h1>

            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {feature.description}
            </p>

            <div className="mt-8 rounded-[28px] bg-white/70 border border-white/50 p-6">
              <p className="text-sm font-semibold text-violet-600 mb-2">
                What this can do
              </p>
              <p className="text-gray-700 leading-relaxed">
                {feature.preview}
              </p>
            </div>
          </div>

          <div className="rounded-[40px] bg-white/55 border border-white/40 backdrop-blur-2xl p-6 shadow-[0_10px_70px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-5">
              Ask NOVA
            </h2>

            <div className="h-[360px] overflow-y-auto space-y-4 pr-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] rounded-[24px] px-5 py-4 leading-relaxed ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                        : "bg-white/80 border border-white/60 text-gray-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[78%] rounded-[24px] px-5 py-4 bg-white/80 border border-white/60 text-gray-500">
                    NOVA is thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend()
                }}
                type="text"
                placeholder={`Ask NOVA about ${feature.title}...`}
                className="flex-1 rounded-full px-5 py-4 bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-violet-300 transition-all"
              />

              <button
                onClick={handleSend}
                disabled={isLoading}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white flex items-center justify-center hover:scale-105 transition-all disabled:opacity-60"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default FeatureScreen