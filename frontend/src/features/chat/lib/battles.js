const STORAGE_KEY = "ai-battle-arena:fight-card:v1"

const isStoredBattle = (battle) =>
  Boolean(battle) &&
  typeof battle.id === "string" &&
  typeof battle.title === "string" &&
  Array.isArray(battle.messages)

export const loadFightCard = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { chats: [], activeChatId: null }

    const saved = JSON.parse(raw)
    const chats = Array.isArray(saved?.chats) ? saved.chats.filter(isStoredBattle) : []
    const activeChatId = chats.some((chat) => chat.id === saved?.activeChatId)
      ? saved.activeChatId
      : null

    return { chats, activeChatId }
  } catch {
    return { chats: [], activeChatId: null }
  }
}

export const saveFightCard = (chats, activeChatId) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }))
  } catch (error) {
    console.warn("Could not save the fight card:", error)
  }
}

export const formatBoutNumber = (index) => String(index + 1).padStart(2, "0")

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export const getBattleDate = (chat) => {
  const value = chat?.createdAt ?? chat?.id
  const date = typeof value === "string" && value.includes("-") ? new Date(value) : new Date(Number(value))

  return Number.isNaN(date.getTime()) ? null : date
}

export const formatBattleDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : "Undated"

export const getResultMessage = (chat) =>
  chat?.messages?.find((message) => message?.result) ?? null

export const getBattleOutcome = (chat) => {
  const judge = getResultMessage(chat)?.result?.judge

  if (!judge) return { label: "Pending", tone: "pending" }
  if (judge.winner === "solution_1") return { label: "Cohere won", tone: "red" }
  if (judge.winner === "solution_2") return { label: "Groq won", tone: "blue" }
  return { label: "Draw", tone: "draw" }
}

export const formatScore = (score) => {
  const numeric = Number(score)
  if (Number.isFinite(numeric)) return String(numeric).padStart(2, "0")
  if (score === null || score === undefined || score === "") return "–"
  return String(score)
}

export const parseAnswer = (text) => {
  const source = typeof text === "string" ? text : ""
  const parts = []
  const codeFence = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeFence.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: source.slice(lastIndex, match.index) })
    }
    parts.push({ type: "code", content: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < source.length) {
    parts.push({ type: "text", content: source.slice(lastIndex) })
  }

  return parts
}

export const describeBattleError = (error) => {
  const status = error?.response?.status

  if (status === 429) return "The arena is rate-limited. Wait a minute, then try again."
  if (status >= 500) return "The arena server hit a snag. Try again in a moment."
  if (!error?.response) return "Couldn't reach the arena. Check your connection and try again."
  return "The battle couldn't start. Try again."
}
