import test from "node:test"
import assert from "node:assert/strict"
import {
    buildJudgeJsonPrompt,
    buildJudgePrompt,
    extractJudgeJson,
    finalizeJudge,
    parseJudgeJson,
} from "./judge.js"

const input = {
    problem: "Explain database indexes.",
    solution_1: "An index is a lookup structure.",
    solution_2: "Indexes speed up reads.",
    model_1: "GPT-4o-mini",
    model_2: "Claude Sonnet 5.5",
}

test("builds a judge prompt with both model labels", () => {
    const prompt = buildJudgePrompt(input)

    assert.match(prompt, /GPT-4o-mini/)
    assert.match(prompt, /Claude Sonnet 5\.5/)
    assert.match(prompt, /Explain database indexes/)
})

test("JSON prompt names the required keys", () => {
    const prompt = buildJudgeJsonPrompt(input)

    for (const key of [
        "solution_1_score",
        "solution_2_score",
        "solution_1_feedback",
        "solution_2_feedback",
    ]) {
        assert.match(prompt, new RegExp(key))
    }
})

test("parses JSON wrapped in code fences", () => {
    const text = `Here is the verdict:
\`\`\`json
{
  "solution_1_score": 8,
  "solution_2_score": 7,
  "solution_1_feedback": "Clear and complete.",
  "solution_2_feedback": "Good, but shorter."
}
\`\`\``

    const verdict = parseJudgeJson(text)

    assert.equal(verdict.solution_1_score, 8)
    assert.equal(verdict.solution_2_score, 7)
    assert.equal(verdict.solution_1_feedback, "Clear and complete.")
})

test("coerces string scores and clamps them to the 0 to 10 range", () => {
    const verdict = parseJudgeJson(`{
  "solution_1_score": "9/10",
  "solution_2_score": 24,
  "solution_1_feedback": "Strong.",
  "solution_2_feedback": "Off the scale."
}`)

    assert.equal(verdict.solution_1_score, 9)
    assert.equal(verdict.solution_2_score, 10)
})

test("tolerates missing feedback and trailing commas", () => {
    const verdict = parseJudgeJson(`{
  "solution_1_score": 5,
  "solution_2_score": 5,
  "solution_1_feedback": "Even.",
}`)

    assert.equal(verdict.solution_2_feedback, "")
})

test("extract rejects a response without an object", () => {
    assert.throws(() => extractJudgeJson("No JSON here"), /JSON object/)
})

test("finalize derives the winner from the scores", () => {
    assert.equal(
        finalizeJudge({
            solution_1_score: 8,
            solution_2_score: 7,
            solution_1_feedback: "",
            solution_2_feedback: "",
        }).winner,
        "solution_1",
    )
    assert.equal(
        finalizeJudge({
            solution_1_score: 7,
            solution_2_score: 8,
            solution_1_feedback: "",
            solution_2_feedback: "",
        }).winner,
        "solution_2",
    )
    assert.equal(
        finalizeJudge({
            solution_1_score: 7,
            solution_2_score: 7,
            solution_1_feedback: "",
            solution_2_feedback: "",
        }).winner,
        "tie",
    )
})
