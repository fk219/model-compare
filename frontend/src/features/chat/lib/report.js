import {
  formatBattleDate,
  getBattleDate,
  getResultMessage,
  getVerdictLine,
} from "./battles"

const scoreText = (score) => {
  const numeric = Number(score)
  return Number.isFinite(numeric) ? String(numeric) : "–"
}

const winnerText = (judge) => {
  if (judge?.winner === "solution_1") return "Cohere wins"
  if (judge?.winner === "solution_2") return "Groq wins"
  return "Draw"
}

const blockquote = (value) => {
  const lines = typeof value === "string" && value.trim() ? value.split(/\r?\n/) : ["_No prompt recorded._"]
  return lines.map((line) => `> ${line}`)
}

const answerBlock = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : "_No answer was returned for this corner._"

const feedbackBlock = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : "_No judge reasoning was returned for this corner._"

export const buildReportMarkdown = (chat) => {
  const result = getResultMessage(chat)?.result ?? {}
  const judge = result.judge ?? {}
  const prompt =
    chat?.messages?.find((message) => message.role === "user")?.content ?? chat?.title ?? ""
  const verdict = getVerdictLine(judge)

  const lines = [
    "# Model Arena: Bout report",
    "",
    `**Date:** ${formatBattleDate(getBattleDate(chat))}`,
    `**Winner:** ${winnerText(judge)}`,
    `**Scoreline:** Cohere ${scoreText(judge.solution_1_score)}/10 · Groq ${scoreText(judge.solution_2_score)}/10`,
    "",
    "## Prompt",
    "",
    ...blockquote(prompt),
    "",
    "## Verdict",
    "",
    verdict ? `**${verdict.label}:** ${verdict.text}` : "_No verdict recorded._",
    "",
    `## Cohere: ${scoreText(judge.solution_1_score)}/10`,
    "",
    answerBlock(result.solution_1),
    "",
    "### Judge's reasoning",
    "",
    feedbackBlock(judge.solution_1_feedback),
    "",
    `## Groq: ${scoreText(judge.solution_2_score)}/10`,
    "",
    answerBlock(result.solution_2),
    "",
    "### Judge's reasoning",
    "",
    feedbackBlock(judge.solution_2_feedback),
    "",
    "---",
    "",
    "Generated from Model Arena, a head-to-head model arena.",
    "",
  ]

  return lines.join("\n")
}

export const buildReportFilename = (chat) => {
  const date = getBattleDate(chat)
  const stamp = date ? date.toISOString().slice(0, 10) : "undated"

  return `model-arena-${stamp}.md`
}

export const downloadBattleReport = (chat) => {
  const markdown = buildReportMarkdown(chat)
  const filename = buildReportFilename(chat)
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)

  try {
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return filename
}
