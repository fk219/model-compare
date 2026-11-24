import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string"
import { getBattleModelLabels, getResultMessage } from "./battles"

export const MAX_ENCODED_SHARE_LENGTH = 16000

const SHARE_VERSION = 1
const SHARE_PREFIX = "#b="
const MAX_DECOMPRESSED_LENGTH = 200000
const MAX_PROMPT_LENGTH = 4000
const MAX_ANSWER_LENGTH = 120000
const MAX_FEEDBACK_LENGTH = 20000
const MAX_MODEL_LABEL_LENGTH = 80

export class ShareError extends Error {
  constructor(code, message) {
    super(message)
    this.name = "ShareError"
    this.code = code
  }
}

const isScore = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10

const isWinner = (value) =>
  value === "solution_1" || value === "solution_2" || value === "tie"

const isWellFormed = (payload) =>
  payload?.v === SHARE_VERSION &&
  typeof payload.prompt === "string" &&
  payload.prompt.trim().length > 0 &&
  typeof payload.a1 === "string" &&
  typeof payload.a2 === "string" &&
  typeof payload.f1 === "string" &&
  typeof payload.f2 === "string" &&
  isScore(payload.s1) &&
  isScore(payload.s2) &&
  isWinner(payload.winner)

const exceedsFieldLimits = (payload) =>
  payload.prompt.length > MAX_PROMPT_LENGTH ||
  payload.a1.length > MAX_ANSWER_LENGTH ||
  payload.a2.length > MAX_ANSWER_LENGTH ||
  payload.f1.length > MAX_FEEDBACK_LENGTH ||
  payload.f2.length > MAX_FEEDBACK_LENGTH ||
  (typeof payload.m1 === "string" && payload.m1.length > MAX_MODEL_LABEL_LENGTH) ||
  (typeof payload.m2 === "string" && payload.m2.length > MAX_MODEL_LABEL_LENGTH)

const makePayload = (chat) => {
  const result = getResultMessage(chat)?.result
  const judge = result?.judge

  if (!result || !judge) {
    throw new ShareError("empty", "This bout doesn't have a finished scorecard to share yet.")
  }

  const prompt =
    chat?.messages?.find((message) => message.role === "user")?.content ??
    chat?.title ??
    ""
  const labels = getBattleModelLabels(result)

  const payload = {
    v: SHARE_VERSION,
    at: typeof chat?.createdAt === "string" ? chat.createdAt : null,
    m1: labels.model1,
    m2: labels.model2,
    prompt: typeof prompt === "string" ? prompt : "",
    a1: typeof result.solution_1 === "string" ? result.solution_1 : "",
    a2: typeof result.solution_2 === "string" ? result.solution_2 : "",
    s1: Number(judge.solution_1_score),
    s2: Number(judge.solution_2_score),
    f1: typeof judge.solution_1_feedback === "string" ? judge.solution_1_feedback : "",
    f2: typeof judge.solution_2_feedback === "string" ? judge.solution_2_feedback : "",
    winner:
      judge.winner === "solution_1" || judge.winner === "solution_2"
        ? judge.winner
        : "tie",
  }

  return payload
}

export const encodeBattle = (chat) => {
  const payload = makePayload(chat)

  if (exceedsFieldLimits(payload)) {
    throw new ShareError(
      "too-large",
      "This report is too long to fit in a share link. Use Export report instead.",
    )
  }

  if (!isWellFormed(payload)) {
    throw new ShareError(
      "invalid",
      "This bout's scorecard is incomplete and can't be packed into a link. Use Export report instead.",
    )
  }

  const json = JSON.stringify(payload)

  if (json.length > MAX_DECOMPRESSED_LENGTH) {
    throw new ShareError(
      "too-large",
      "This report is too long to fit in a share link. Use Export report instead.",
    )
  }

  const encoded = compressToEncodedURIComponent(json)

  if (!encoded) {
    throw new ShareError("invalid", "This report couldn't be packed into a link. Use Export report instead.")
  }

  if (encoded.length > MAX_ENCODED_SHARE_LENGTH) {
    throw new ShareError(
      "too-large",
      "This report is too long to fit in a share link. Use Export report instead.",
    )
  }

  return encoded
}

export const decodeBattle = (encoded) => {
  if (typeof encoded !== "string" || !encoded) {
    throw new ShareError("corrupt", "This report link is damaged or incomplete.")
  }

  if (encoded.length > MAX_ENCODED_SHARE_LENGTH) {
    throw new ShareError("too-large", "This report link is too large to open.")
  }

  const json = decompressFromEncodedURIComponent(encoded)

  if (!json) {
    throw new ShareError("corrupt", "This report link is damaged or incomplete.")
  }

  if (json.length > MAX_DECOMPRESSED_LENGTH) {
    throw new ShareError("too-large", "This report link is too large to open.")
  }

  let payload

  try {
    payload = JSON.parse(json)
  } catch {
    throw new ShareError("corrupt", "This report link is damaged or incomplete.")
  }

  const valid = isWellFormed(payload)

  if (!valid) {
    throw new ShareError("corrupt", "This report link is damaged or incomplete.")
  }

  if (exceedsFieldLimits(payload)) {
    throw new ShareError("too-large", "This report link is too large to open.")
  }

  const createdAt =
    typeof payload.at === "string" && payload.at.length <= 40 && !Number.isNaN(Date.parse(payload.at))
      ? payload.at
      : null

  return {
    id: "shared-report",
    title: payload.prompt,
    createdAt,
    messages: [
      { id: "shared-report-question", role: "user", content: payload.prompt },
      {
        id: "shared-report-result",
        result: {
          model_1: typeof payload.m1 === "string" ? payload.m1 : undefined,
          model_2: typeof payload.m2 === "string" ? payload.m2 : undefined,
          solution_1: payload.a1,
          solution_2: payload.a2,
          judge: {
            solution_1_score: payload.s1,
            solution_2_score: payload.s2,
            solution_1_feedback: payload.f1,
            solution_2_feedback: payload.f2,
            winner: payload.winner,
          },
        },
      },
    ],
  }
}

export const createShareUrl = (chat) => {
  const encoded = encodeBattle(chat)
  const url = new URL(window.location.href)

  url.hash = `b=${encoded}`
  return url.toString()
}

export const readSharedReport = () => {
  if (typeof window === "undefined") return { status: "none" }

  const hash = window.location.hash

  if (!hash.startsWith(SHARE_PREFIX)) return { status: "none" }

  try {
    return { status: "ok", battle: decodeBattle(hash.slice(SHARE_PREFIX.length)) }
  } catch (error) {
    const reason = error instanceof ShareError && error.code === "too-large" ? "too-large" : "corrupt"

    return {
      status: "error",
      reason,
      message:
        reason === "too-large"
          ? "This report link is too large to open. Ask for a fresh link, or start your own bout."
          : "This report link is damaged or incomplete. Ask for a fresh link, or start your own bout.",
    }
  }
}

export const clearShareHash = () => {
  if (typeof window === "undefined" || !window.location.hash.startsWith(SHARE_PREFIX)) return

  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
}
