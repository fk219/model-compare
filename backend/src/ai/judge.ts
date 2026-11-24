import { z } from "zod/v4"

export const judgeOutputSchema = z.object({
    solution_1_score: z
        .number()
        .min(0)
        .max(10)
        .describe("Score for fighter A from 0 to 10"),
    solution_2_score: z
        .number()
        .min(0)
        .max(10)
        .describe("Score for fighter B from 0 to 10"),
    solution_1_feedback: z
        .string()
        .describe("Short reasoning for the fighter A score"),
    solution_2_feedback: z
        .string()
        .describe("Short reasoning for the fighter B score"),
})

export type JudgeVerdict = z.infer<typeof judgeOutputSchema>

export type JudgeWinner = "solution_1" | "solution_2" | "tie"

export type JudgeResult = JudgeVerdict & {
    winner: JudgeWinner
}

export type JudgeInput = {
    problem: string
    solution_1: string
    solution_2: string
    model_1: string
    model_2: string
}

const scoreSchema = z.preprocess((value) => {
    const raw =
        typeof value === "string"
            ? value.match(/-?\d+(?:\.\d+)?/)?.[0]
            : value
    const numeric = Number(raw)

    if (!Number.isFinite(numeric)) return 0
    return Math.min(10, Math.max(0, numeric))
}, z.number().min(0).max(10))

const feedbackSchema = z.preprocess((value) => {
    if (typeof value === "string") return value
    if (value === null || value === undefined) return ""
    return JSON.stringify(value)
}, z.string())

/**
 * Lenient parser for the JSON fallback path. Scores may arrive as strings like
 * "8/10", so numbers are extracted and clamped before validation.
 */
export const lenientJudgeSchema = z.object({
    solution_1_score: scoreSchema,
    solution_2_score: scoreSchema,
    solution_1_feedback: feedbackSchema,
    solution_2_feedback: feedbackSchema,
})

export const buildJudgePrompt = ({
    problem,
    solution_1,
    solution_2,
    model_1,
    model_2,
}: JudgeInput) => `You are the judge for a head-to-head model battle.
Score each answer out of 10 and explain the score in two or three sentences.
Fighter A is ${model_1}.
Fighter B is ${model_2}.

Problem:
${problem}

Fighter A answer:
${solution_1}

Fighter B answer:
${solution_2}

Be fair to both answers and judge only the quality of the response to the problem.`

export const buildJudgeJsonPrompt = (input: JudgeInput) => `${buildJudgePrompt(input)}

Return only one JSON object with exactly these keys:
{
  "solution_1_score": 0,
  "solution_2_score": 0,
  "solution_1_feedback": "",
  "solution_2_feedback": ""
}
Use numbers between 0 and 10 for the scores. Do not wrap the JSON in code fences or add text around it.`

export const extractJudgeJson = (text: string) => {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("The judge returned an empty response")
    }

    const source = text.replace(/```(?:json)?/gi, "").replace(/```/g, "")
    const start = source.indexOf("{")
    const end = source.lastIndexOf("}")

    if (start === -1 || end <= start) {
        throw new Error("The judge did not return a JSON object")
    }

    return source
        .slice(start, end + 1)
        .replace(/,\s*([}\]])/g, "$1")
}

export const parseJudgeJson = (text: string): JudgeVerdict => {
    const parsed = JSON.parse(extractJudgeJson(text)) as unknown
    return lenientJudgeSchema.parse(parsed)
}

export const finalizeJudge = (verdict: JudgeVerdict): JudgeResult => {
    const winner: JudgeWinner =
        verdict.solution_1_score > verdict.solution_2_score
            ? "solution_1"
            : verdict.solution_2_score > verdict.solution_1_score
              ? "solution_2"
              : "tie"

    return { ...verdict, winner }
}
