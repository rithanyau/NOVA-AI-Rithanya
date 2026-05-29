const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

function cleanText(text = "") {
  return text.toLowerCase().trim()
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word))
}

/* ---------------- ATTENDANCE AI ---------------- */
/* ---------------- ATTENDANCE AI ---------------- */

let lastAttendanceData = null

function numberNearLabel(text, labels) {
  for (const label of labels) {
    const labelThenNumber = new RegExp(
      `${label}\\s*(is|=|:|are|was|were)?\\s*(\\d+(\\.\\d+)?)`,
      "i"
    )

    const first = text.match(labelThenNumber)
    if (first) return Number(first[2])

    const numberThenLabel = new RegExp(`(\\d+(\\.\\d+)?)\\s*${label}`, "i")
    const second = text.match(numberThenLabel)
    if (second) return Number(second[1])
  }

  return null
}

function getAttendanceData(message) {
  const text = cleanText(message)

  let total = null
  let attended = null
  let required = 75
  let remaining = null
  let miss = null
  let attendNext = null
  let percentageOnly = null
  let subject = null

  const subjectMatch = text.match(/(maths|math|java|dbms|python|dsa|english|statistics|stats|cn|os|web)/i)
  if (subjectMatch) subject = subjectMatch[1].toUpperCase()

  const outOf = text.match(/(\d+)\s*(out of|\/)\s*(\d+)/i)
  if (outOf) {
    attended = Number(outOf[1])
    total = Number(outOf[3])
  }

  const percent = text.match(/(\d+(\.\d+)?)\s*%/)
  if (percent) percentageOnly = Number(percent[1])

  const foundTotal = numberNearLabel(text, [
    "total classes",
    "classes held",
    "classes conducted",
    "total",
    "held",
    "conducted",
  ])
  if (foundTotal !== null) total = foundTotal

  const foundAttended = numberNearLabel(text, [
    "attended classes",
    "classes attended",
    "present classes",
    "attended",
    "present",
  ])
  if (foundAttended !== null) attended = foundAttended

  const foundRequired = numberNearLabel(text, [
    "required attendance",
    "required percentage",
    "minimum attendance",
    "required",
    "minimum",
    "need",
  ])
  if (foundRequired !== null) required = foundRequired

  const foundRemaining = numberNearLabel(text, [
    "remaining classes",
    "classes left",
    "remaining",
    "left",
    "upcoming classes",
    "upcoming",
  ])
  if (foundRemaining !== null) remaining = foundRemaining

  const missMatch = text.match(/(miss|bunk|skip|absent)\s*(for)?\s*(\d+)/i)
  if (missMatch) miss = Number(missMatch[3])

  const tomorrowClassMatch = text.match(/tomorrow.*?(\d+)\s*(class|classes)/i)
  if (tomorrowClassMatch && hasAny(text, ["bunk", "miss", "skip", "absent"])) {
    miss = Number(tomorrowClassMatch[1])
  }

  const attendMatch = text.match(/(attend|present for|go for)\s*(next)?\s*(\d+)/i)
  if (attendMatch) attendNext = Number(attendMatch[3])

  if (
    miss === null &&
    hasAny(text, ["bunk tomorrow", "miss tomorrow", "skip tomorrow"])
  ) {
    miss = 1
  }

  return {
    subject,
    total,
    attended,
    required,
    remaining,
    miss,
    attendNext,
    percentageOnly,
  }
}

function attendancePercent(total, attended) {
  return (attended / total) * 100
}

function classesNeeded(total, attended, required) {
  const r = required / 100
  return Math.ceil((r * total - attended) / (1 - r))
}

function safeBunks(total, attended, required) {
  const r = required / 100
  return Math.max(0, Math.floor(attended / r - total))
}

function getRiskLevel(current, required) {
  if (current >= required + 10) return "Very Safe"
  if (current >= required + 5) return "Safe"
  if (current >= required) return "Borderline Safe"
  if (current >= required - 5) return "Warning"
  return "Danger"
}

function getAttendanceReply(message) {
  const text = cleanText(message)
  let data = getAttendanceData(message)

  const hasFreshData = data.total !== null && data.attended !== null

  if (hasFreshData) {
    lastAttendanceData = {
      subject: data.subject,
      total: data.total,
      attended: data.attended,
      required: data.required,
    }
  }

  if (!hasFreshData && lastAttendanceData) {
    data = {
      ...data,
      subject: data.subject || lastAttendanceData.subject,
      total: lastAttendanceData.total,
      attended: lastAttendanceData.attended,
      required: data.required || lastAttendanceData.required || 75,
    }
  }

  if (data.percentageOnly !== null && data.total === null && data.attended === null) {
    return `
I detected your attendance as ${data.percentageOnly}%.

But for accurate bunk/recovery calculation, I need:
1. Total classes
2. Attended classes

Example:
"DBMS total 40 attended 28"

A percentage alone is not enough because the same percentage changes differently depending on class count.
`
  }

  if (data.total === null || data.attended === null) {
    return `
I need your base attendance data first.

You can type:
- "DBMS total 40 attended 28"
- "I attended 30 out of 40 classes"
- "Java 42/60 attendance"
- "Total 50 present 42 required 80"
- "Classes held 60 attended 45"

Then ask:
- "Can I bunk tomorrow?"
- "Tomorrow has 5 classes, can I skip?"
- "Can I miss 3 DBMS classes?"
- "If I attend next 10 classes, will I be safe?"
`
  }

  const { subject, total, attended, required, remaining, miss, attendNext } = data

  if (total <= 0 || attended < 0 || attended > total) {
    return `
The attendance values do not look valid.

Check:
1. Total classes must be greater than 0.
2. Attended classes cannot be negative.
3. Attended classes cannot be more than total classes.
`
  }

  const current = attendancePercent(total, attended)
  const risk = getRiskLevel(current, required)

  let reply = `
Attendance Report${subject ? ` for ${subject}` : ""}

Total classes: ${total}
Attended classes: ${attended}
Current attendance: ${current.toFixed(2)}%
Required attendance: ${required}%
Risk level: ${risk}
`

  if (miss !== null) {
    const newTotal = total + miss
    const newAttended = attended
    const newPercentage = attendancePercent(newTotal, newAttended)
    const newRisk = getRiskLevel(newPercentage, required)

    reply += `

If you miss ${miss} class/classes:
New total classes: ${newTotal}
New attended classes: ${newAttended}
New attendance: ${newPercentage.toFixed(2)}%
New risk level: ${newRisk}
`

    reply +=
      newPercentage >= required
        ? `\nResult: You can miss ${miss} class/classes and still stay above ${required}%, but avoid using all your margin.\n`
        : `\nResult: You should not miss ${miss} class/classes because it will put you below ${required}%.\n`
  }

  if (attendNext !== null) {
    const newTotal = total + attendNext
    const newAttended = attended + attendNext
    const newPercentage = attendancePercent(newTotal, newAttended)
    const newRisk = getRiskLevel(newPercentage, required)

    reply += `

If you attend the next ${attendNext} class/classes:
New total classes: ${newTotal}
New attended classes: ${newAttended}
New attendance: ${newPercentage.toFixed(2)}%
New risk level: ${newRisk}
`

    reply +=
      newPercentage >= required
        ? `\nResult: Attending the next ${attendNext} classes will keep you safe or help you recover.\n`
        : `\nResult: Even after attending ${attendNext} classes, you may still be below ${required}%.\n`
  }

  if (current < required) {
    const needed = classesNeeded(total, attended, required)

    reply += `

Status: Below requirement.

You need to attend about ${needed} more class/classes continuously without missing any to reach ${required}%.
`
  } else {
    const bunkCount = safeBunks(total, attended, required)

    reply += `

Status: Currently safe.

You can miss about ${bunkCount} class/classes and still stay around ${required}%.
`
  }

  if (remaining !== null) {
    const finalTotal = total + remaining
    const finalAttended = attended + remaining
    const finalPercentage = attendancePercent(finalTotal, finalAttended)

    const r = required / 100
    const minimumToAttend = Math.ceil(r * finalTotal - attended)
    const safeMisses = Math.max(0, remaining - Math.max(0, minimumToAttend))

    reply += `

Remaining classes: ${remaining}

If you attend all remaining classes:
Final attendance: ${finalPercentage.toFixed(2)}%

Minimum classes to attend from remaining: ${Math.max(0, minimumToAttend)}
Approx classes you can miss from remaining: ${safeMisses}
`

    if (finalPercentage < required) {
      reply += `
Warning: Even attending all remaining classes may not reach ${required}%. You may need extra classes, OD, medical consideration, or faculty support.
`
    }
  }

  reply += `

Why NOVA says this:
- Attendance is calculated as attended classes ÷ total classes × 100.
- Missing a class increases total classes but does not increase attended classes.
- Attending a class increases both total and attended classes.
- This assumes every class has equal attendance weight.
`

  return reply
}
/* ---------------- STUDY PLANNER ---------------- */

function getStudySubjects(message) {
  const text = cleanText(message)

  const subjects = [
    { name: "Maths", words: ["maths", "math", "mathematics"] },
    { name: "Statistics", words: ["statistics", "stats"] },
    { name: "Java", words: ["java"] },
    { name: "DBMS", words: ["dbms", "database"] },
    { name: "Python", words: ["python"] },
    { name: "DSA", words: ["dsa", "data structures"] },
    { name: "English", words: ["english"] },
    { name: "Web Development", words: ["web", "html", "css", "javascript", "react"] },
    { name: "AI", words: ["ai", "artificial intelligence"] },
    { name: "Machine Learning", words: ["machine learning", "ml"] },
  ]

  return subjects
    .filter((subject) => subject.words.some((word) => text.includes(word)))
    .map((subject) => subject.name)
}

function getStudyHours(message) {
  const text = cleanText(message)
  const match = text.match(/(\d+)\s*(hour|hours|hr|hrs|study hours|study hour)/i)
  return match ? Number(match[1]) : null
}

function getStudyDays(message) {
  const text = cleanText(message)
  const match = text.match(/(\d+)\s*(day|days)/i)

  if (match) return Number(match[1])
  if (text.includes("tomorrow")) return 1
  if (text.includes("today")) return 0

  return null
}

function getExamDate(message) {
  const text = cleanText(message)
  const match = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  return match ? match[0] : null
}

function getStudyIntent(message) {
  const text = cleanText(message)

  if (hasAny(text, ["assignment", "homework", "deadline", "submit"])) {
    return "assignment"
  }

  if (hasAny(text, ["exam", "test", "internal", "quiz"])) {
    return "exam"
  }

  if (hasAny(text, ["revision", "revise", "recap"])) {
    return "revision"
  }

  if (hasAny(text, ["routine", "schedule", "timetable"])) {
    return "routine"
  }

  return "general study"
}

function getStudyPlannerReply(message) {
  const text = cleanText(message)
  const subjects = getStudySubjects(message)
  const hours = getStudyHours(message)
  const days = getStudyDays(message)
  const examDate = getExamDate(message)
  const intent = getStudyIntent(message)

  const stressed = hasAny(text, [
    "stress",
    "stressed",
    "panic",
    "overwhelmed",
    "scared",
  ])

  const missing = []

  if (subjects.length === 0) missing.push("subject names")
  if (hours === null && days === null && examDate === null) {
    missing.push("available study time or deadline")
  }

  if (missing.length > 0) {
    return `
I can make a detailed study plan, but I need:

${missing.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Try:
"Java and DBMS, 2 study hours, exam date 30.05.2026"
"I have 3 hours for maths and statistics"
"I have exams in 5 days for DBMS and Java"
"I am stressed and have 2 hours for statistics"
`
  }

  const subjectText = subjects.join(" and ")

  if (stressed) {
    return `
First, calm down. We will make this manageable.

Subjects detected: ${subjectText}
Purpose: ${intent}

Immediate reset:
1. 2 minutes — Drink water and clear your desk.
2. 5 minutes — Write down pending topics.
3. 25 minutes — Study only one topic.
4. 5 minutes — Break.
5. Repeat this cycle 3 times.

Do not try to finish everything at once. The first goal is to start.
`
  }

  if (intent === "assignment") {
    return `
Assignment Plan

Subjects: ${subjectText}
${examDate ? `Deadline: ${examDate}` : ""}

1. 15 minutes — Read the question and marking requirements.
2. 30 minutes — Collect references/examples.
3. 45 minutes — Make the outline or code structure.
4. 60 minutes — Complete the main work.
5. 30 minutes — Check formatting, grammar, output, and submission rules.
6. Final 10 minutes — Save/export and submit safely.

Do not leave submission for the last minute.
`
  }

  if (hours !== null) {
    if (hours <= 1) {
      return `
1-Hour Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

1. 10 minutes — Revise formulas/definitions.
2. 35 minutes — Study one important topic.
3. 10 minutes — Solve 2–3 questions.
4. 5 minutes — Quick recap.

Since time is short, focus on one scoring topic only.
`
    }

    if (hours === 2) {
      return `
2-Hour Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

1. 40 minutes — Revise ${subjects[0]}.
2. 10 minutes — Break.
3. 40 minutes — Practice ${subjects[1] || subjects[0]}.
4. 20 minutes — Fix weak areas.
5. 10 minutes — Quick recap.

Priority: practice + mistakes, not only reading.
`
    }

    if (hours === 3) {
      return `
3-Hour Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

1. 50 minutes — Concept revision.
2. 10 minutes — Break.
3. 50 minutes — Practice questions.
4. 10 minutes — Break.
5. 30 minutes — Weak-topic repair.
6. 20 minutes — Recap formulas, definitions, or syntax.
7. 10 minutes — Plan the next session.
`
    }

    return `
${hours}-Hour Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

1. First 25% — Concept revision.
2. Next 35% — Practice questions.
3. Next 20% — Weak-topic repair.
4. Next 10% — Correct mistakes.
5. Final 10% — Quick recap.

Take a 10-minute break after every 50 minutes.
`
  }

  if (days !== null) {
    if (days <= 1) {
      return `
1-Day Emergency Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

1. List only high-weightage topics.
2. Study repeated question areas first.
3. Practice important problems.
4. Skip low-priority topics if time is short.
5. End with formulas, definitions, syntax, or short notes.
6. Sleep properly before the exam/submission.
`
    }

    if (days <= 3) {
      return `
${days}-Day Study Plan

Subjects: ${subjectText}
Purpose: ${intent}

Day 1 — Cover core concepts and make short notes.
Day 2 — Practice questions and assignments.
Day 3 — Revise mistakes, weak areas, formulas, and repeated questions.

Avoid learning too many new topics at the end.
`
    }

    return `
${days}-Day Study Strategy

Subjects: ${subjectText}
Purpose: ${intent}

Phase 1 — First 40% of days:
Learn and revise core concepts.

Phase 2 — Middle 40% of days:
Practice questions and previous papers.

Phase 3 — Last 20% of days:
Mock tests, weak-topic repair, and final recap.
`
  }

  return `
I detected ${subjectText} and date ${examDate}.
Tell me how many hours per day you can study, and I will make a sharper plan.
`
}

/* ---------------- FOOD FINDER ---------------- */

const chennaiFoodPlaces = [
  {
    name: "A2B",
    area: "t nagar",
    type: "restaurant",
    tags: ["veg", "budget", "meals", "quick", "dosa"],
    price: 180,
    note: "Good for quick South Indian meals and snacks.",
  },
  {
    name: "Murugan Idli Shop",
    area: "t nagar",
    type: "restaurant",
    tags: ["veg", "idli", "dosa", "budget", "quick"],
    price: 150,
    note: "Good for idli, dosa, and quick South Indian food.",
  },
  {
    name: "Writer's Cafe",
    area: "anna nagar",
    type: "cafe",
    tags: ["cafe", "coffee", "study", "snacks"],
    price: 300,
    note: "Good café-style option for coffee and studying.",
  },
  {
    name: "Sangeetha Veg Restaurant",
    area: "adyar",
    type: "restaurant",
    tags: ["veg", "meals", "dosa", "comfort"],
    price: 200,
    note: "Reliable veg option for meals, dosa, and tiffin.",
  },
  {
    name: "Zaitoon",
    area: "velachery",
    type: "restaurant",
    tags: ["non veg", "chicken", "biryani", "spicy"],
    price: 300,
    note: "Popular for non-veg and biryani-style meals.",
  },
  {
    name: "Cafe Coffee Day",
    area: "nungambakkam",
    type: "cafe",
    tags: ["cafe", "coffee", "study", "snacks"],
    price: 250,
    note: "Basic café option for coffee and sitting for some time.",
  },
  {
    name: "Hot Chips",
    area: "tambaram",
    type: "restaurant",
    tags: ["veg", "budget", "meals", "quick"],
    price: 160,
    note: "Budget-friendly veg food and snacks.",
  },
  {
    name: "KFC",
    area: "guindy",
    type: "fast food",
    tags: ["non veg", "chicken", "quick", "fast food"],
    price: 250,
    note: "Quick chicken-based fast food option.",
  },
  {
    name: "Cream Centre",
    area: "mylapore",
    type: "restaurant",
    tags: ["veg", "comfort", "meals"],
    price: 350,
    note: "Good veg comfort food option.",
  },
  {
    name: "SS Hyderabad Biryani",
    area: "porur",
    type: "restaurant",
    tags: ["non veg", "biryani", "chicken", "spicy"],
    price: 280,
    note: "Good for biryani cravings.",
  },
]

function detectFoodArea(message) {
  const text = cleanText(message)
  const areas = [
    "t nagar",
    "adyar",
    "anna nagar",
    "velachery",
    "nungambakkam",
    "tambaram",
    "guindy",
    "besant nagar",
    "mylapore",
    "porur",
    "omr",
  ]

  return areas.find((area) => text.includes(area)) || null
}

function detectFoodBudget(message) {
  const text = cleanText(message)
  const match = text.match(/under\s*(₹|rs|inr)?\s*(\d+)/i)

  if (match) return Number(match[2])
  if (text.includes("cheap") || text.includes("budget")) return 200

  return null
}

function getFoodReply(message) {
  const text = cleanText(message)
  const area = detectFoodArea(message)
  const budget = detectFoodBudget(message)

  const tags = [
    "veg",
    "non veg",
    "chicken",
    "biryani",
    "cafe",
    "coffee",
    "study",
    "healthy",
    "quick",
    "spicy",
    "meals",
    "dosa",
    "idli",
    "fast food",
    "comfort",
  ]

  const matchedTags = tags.filter((tag) => text.includes(tag))
  const missing = []

  if (!area) missing.push("location/area in Chennai")
  if (!budget) missing.push("budget")

  if (missing.length > 0) {
    return `
I can suggest food better, but I need:

${missing.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Try:
"Cheap veg food near T Nagar under 200"
"Study cafe near Anna Nagar under 300"
"Spicy chicken food near Velachery under 350"
`
  }

  let results = chennaiFoodPlaces.filter((place) => place.area === area)
  results = results.filter((place) => place.price <= budget)

  if (matchedTags.length > 0) {
    results = results.filter((place) =>
      matchedTags.some((tag) => place.tags.includes(tag))
    )
  }

  if (!results.length) {
    const nearby = chennaiFoodPlaces
      .filter((place) => place.price <= budget)
      .slice(0, 3)

    return `
I could not find an exact match in ${area} under ₹${budget}.

Closest alternatives from the demo dataset:

${nearby
  .map(
    (place, index) =>
      `${index + 1}. ${place.name} — ${place.area}, ₹${place.price}, ${place.note}`
  )
  .join("\n")}
`
  }

  const formatted = results
    .map((place, index) => {
      return `${index + 1}. ${place.name}
Area: ${place.area}
Type: ${place.type}
Approx price: ₹${place.price}
Why it matches: ${place.note}`
    })
    .join("\n\n")

  return `
Here are matching food suggestions:

${formatted}

Note: This uses NOVA's Chennai demo dataset. It can later be upgraded with Google Places/OpenStreetMap.
`
}

/* ---------------- STRESS ASSISTANT ---------------- */

async function getStressReply(message) {
  const text = cleanText(message)

  let studentTip = "Start with one small task for 10 minutes. Do not try to solve everything at once."
  let plan = `
Quick reset:
1. Drink water.
2. Keep your phone away for 10 minutes.
3. Write only the next task.
4. Work for 10 minutes.
5. Stop and reassess.
`

  if (hasAny(text, ["exam", "test", "quiz"])) {
    studentTip =
      "For exam stress, stop trying to study everything. Pick one scoring topic and study it for one 25-minute block."
    plan = `
Exam stress plan:
1. List only high-weightage topics.
2. Choose the easiest scoring topic.
3. Study for 25 minutes.
4. Solve 2 questions.
5. Revise mistakes.
6. Repeat with the next topic.
`
  } else if (hasAny(text, ["assignment", "deadline", "submit"])) {
    studentTip =
      "For assignment stress, split the task into outline, main work, review, and submission."
    plan = `
Assignment overload plan:
1. Read the requirement once.
2. Make a rough outline.
3. Finish the main content first.
4. Fix formatting later.
5. Submit before the last minute.
`
  } else if (text.includes("attendance")) {
    studentTip =
      "For attendance stress, calculate the exact percentage first. Guessing will only increase panic."
    plan = `
Attendance stress plan:
1. Find total classes.
2. Find attended classes.
3. Calculate current percentage.
4. Check how many classes are left.
5. Decide whether you are safe or need recovery.
`
  } else if (hasAny(text, ["burnout", "tired", "exhausted"])) {
    studentTip =
      "For burnout, do not force a huge productivity session. Reset your body first, then restart small."
    plan = `
Burnout reset:
1. Step away for 10 minutes.
2. Drink water or eat something light.
3. Do one tiny task.
4. Avoid comparing yourself to others.
5. Sleep properly if you are mentally drained.
`
  } else if (hasAny(text, ["procrastination", "lazy", "motivation"])) {
    studentTip =
      "Motivation usually comes after starting, not before starting."
    plan = `
Anti-procrastination plan:
1. Set a 10-minute timer.
2. Do the easiest part first.
3. Do not aim for perfection.
4. After 10 minutes, continue only if you can.
5. Track progress, not mood.
`
  }

  try {
    const response = await fetch("https://api.adviceslip.com/advice")
    const data = await response.json()

    return `
NOVA Stress Support

${studentTip}

${plan}

Live advice:
"${data.slip.advice}"

Reminder:
I can help you organize stress, but if you feel unsafe or overwhelmed beyond control, talk to a trusted person, faculty mentor, counselor, or local emergency support immediately.
`
  } catch (error) {
    return `
NOVA Stress Support

${studentTip}

${plan}

Reminder:
I can help you organize stress, but if you feel unsafe or overwhelmed beyond control, talk to a trusted person, faculty mentor, counselor, or local emergency support immediately.
`
  }
}

/* ---------------- SIMPLE MODULES ---------------- */

function getCareerReply() {
  return `
Career Guide is available in basic mode.

Ask about:
- resume
- internships
- projects
- web development roadmap
- AI/ML roadmap
- placements
`
}

function getEventReply() {
  return `
Event Radar is available in basic mode.

Ask with:
- interest area
- event type
- online/offline
- beginner/advanced

Example:
"Suggest beginner coding hackathons"
`
}

async function getReply(feature, message) {
  if (feature === "Attendance AI") return getAttendanceReply(message)
  if (feature === "Study Planner") return getStudyPlannerReply(message)
  if (feature === "Food Finder") return getFoodReply(message)
  if (feature === "Stress Assistant") return getStressReply(message)
  if (feature === "Career Guide") return getCareerReply(message)
  if (feature === "Event Radar") return getEventReply(message)

  return "Tell me more details so NOVA can help better."
}

app.get("/", (req, res) => {
  res.send("NOVA backend is running")
})

app.post("/chat", async (req, res) => {
  const { message, feature } = req.body
  const reply = await getReply(feature, message)

  res.json({ reply })
})

app.listen(PORT, () => {
  console.log(`NOVA server running on http://localhost:${PORT}`)
})