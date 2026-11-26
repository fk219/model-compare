import { compactText } from "./text"

const STORAGE_KEY = "model-compare:fight-card:v1"

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

export const DEFAULT_MODEL_LABELS = {
  model1: "Cohere",
  model2: "Groq",
}

const readModelLabel = (value, fallback) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback

/**
 * Older saved battles and older share links do not carry model names, so they
 * keep the original Cohere and Groq labels.
 */
export const getBattleModelLabels = (result) => ({
  model1: readModelLabel(result?.model_1, DEFAULT_MODEL_LABELS.model1),
  model2: readModelLabel(result?.model_2, DEFAULT_MODEL_LABELS.model2),
})

export const getBattleOutcome = (chat) => {
  const result = getResultMessage(chat)?.result
  const judge = result?.judge
  const labels = getBattleModelLabels(result)

  if (!judge) return { label: "Pending", tone: "pending" }
  if (judge.winner === "solution_1") return { label: `${labels.model1} won`, tone: "red" }
  if (judge.winner === "solution_2") return { label: `${labels.model2} won`, tone: "blue" }
  return { label: "Draw", tone: "draw" }
}

export const formatScore = (score) => {
  const numeric = Number(score)
  if (Number.isFinite(numeric)) return String(numeric).padStart(2, "0")
  if (score === null || score === undefined || score === "") return "–"
  return String(score)
}

const readableScore = (score) => {
  const numeric = Number(score)
  return Number.isFinite(numeric) ? `${numeric}/10` : null
}

/**
 * Compact, evidence-based verdict line. The reason is always lifted from the
 * judge's own feedback; scores are only used when feedback is missing.
 */
export const getVerdictLine = (judge, labels = DEFAULT_MODEL_LABELS) => {
  if (!judge) return null

  const winner = judge.winner
  const firstScore = readableScore(judge.solution_1_score)
  const secondScore = readableScore(judge.solution_2_score)

  if (winner !== "solution_1" && winner !== "solution_2") {
    const firstNumeric = Number(judge.solution_1_score)
    const secondNumeric = Number(judge.solution_2_score)
    const hasScores = Number.isFinite(firstNumeric) && Number.isFinite(secondNumeric)

    return {
      label: "Why it was a draw",
      text: hasScores
        ? firstNumeric === secondNumeric
          ? `Both corners scored ${firstScore}.`
          : `The judge called it level at ${firstScore}–${secondScore}.`
        : "The judge called it level.",
    }
  }

  const isFirstCorner = winner === "solution_1"
  const feedback = isFirstCorner ? judge.solution_1_feedback : judge.solution_2_feedback
  const reason = compactText(feedback, 240)

  if (reason) {
    return {
      label: isFirstCorner ? `Why ${labels.model1} won` : `Why ${labels.model2} won`,
      text: reason,
    }
  }

  const winnerName = isFirstCorner ? labels.model1 : labels.model2
  const winnerScore = isFirstCorner ? firstScore : secondScore
  const loserScore = isFirstCorner ? secondScore : firstScore

  return {
    label: `Why ${winnerName} won`,
    text:
      winnerScore && loserScore
        ? `${winnerName} scored ${winnerScore} to the other corner's ${loserScore}.`
        : `The judge awarded ${winnerName} the bout.`,
  }
}

export const getCornerFeedback = (judge, solutionKey) => {
  const value = judge?.[`${solutionKey}_feedback`]
  return typeof value === "string" ? value.trim() : ""
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
  const payload = error?.response?.data

  if (status === 429) {
    const retryAfter = Number(payload?.retryAfter)
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? `${Math.ceil(retryAfter)}s` : "a moment"

    return `Arena is at capacity. Try again in ${wait}.`
  }

  if (status === 504) {
    return "The bout timed out. The judge took too long, so try again."
  }

  if (status === 400 && typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error
  }

  if (status >= 500) return "The arena server hit a snag. Try again in a moment."
  if (!error?.response) return "Couldn't reach the arena. Check your connection and try again."
  return "The battle couldn't start. Try again."
}
