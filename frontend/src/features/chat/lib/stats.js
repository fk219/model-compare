import { getResultMessage } from "./battles"

const average = (scores) => {
  if (scores.length === 0) return null
  const total = scores.reduce((sum, score) => sum + score, 0)
  return total / scores.length
}

const collectScore = (value, scores) => {
  const numeric = Number(value)
  if (Number.isFinite(numeric)) scores.push(numeric)
}

export const computeArenaRecord = (chats = []) => {
  const record = {
    total: Array.isArray(chats) ? chats.length : 0,
    firstWins: 0,
    secondWins: 0,
    ties: 0,
    firstAverage: null,
    secondAverage: null,
  }

  if (!Array.isArray(chats)) return record

  const firstScores = []
  const secondScores = []

  chats.forEach((chat) => {
    const judge = getResultMessage(chat)?.result?.judge
    if (!judge) return

    if (judge.winner === "solution_1") record.firstWins += 1
    else if (judge.winner === "solution_2") record.secondWins += 1
    else record.ties += 1

    collectScore(judge.solution_1_score, firstScores)
    collectScore(judge.solution_2_score, secondScores)
  })

  record.firstAverage = average(firstScores)
  record.secondAverage = average(secondScores)

  return record
}

export const formatAverage = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "–"
