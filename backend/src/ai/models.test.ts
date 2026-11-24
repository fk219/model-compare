import test from "node:test"
import assert from "node:assert/strict"
import {
    buildModelsResponse,
    DEFAULT_MODEL_PAIR,
    findModel,
    isCatalogEnabled,
    MODEL_CATALOG,
    resolveModelPair,
} from "./models.js"

const catalogMode = isCatalogEnabled()

const REQUIRED_MODELS = [
    ["openai/gpt-4o-mini", "GPT-4o-mini"],
    ["anthropic/claude-sonnet-5.5", "Claude Sonnet 5.5"],
    ["google/gemini-3.8-flash", "Gemini 3.8 Flash"],
    ["meta-llama/llama-3.1-70b-instruct", "Llama 3.1 70B Instruct"],
    ["mistralai/mistral-large", "Mistral Large"],
    ["deepseek/deepseek-chat", "DeepSeek V3"],
]

test("catalog includes every required model with its label", () => {
    for (const [id, label] of REQUIRED_MODELS) {
        const model = findModel(id)
        assert.ok(model, `missing ${id}`)
        assert.equal(model.label, label)
        assert.ok(model.provider.length > 0)
    }
})

test("catalog IDs are unique", () => {
    const ids = MODEL_CATALOG.map((model) => model.id)
    assert.equal(new Set(ids).size, ids.length)
})

test("models response matches the active provider mode", () => {
    const response = buildModelsResponse()

    if (catalogMode) {
        assert.equal(response.mode, "openrouter")
        assert.deepEqual(
            response.models[0],
            { id: "openai/gpt-4o-mini", label: "GPT-4o-mini", provider: "OpenAI" },
        )
        assert.deepEqual(response.defaultPair, DEFAULT_MODEL_PAIR)
        assert.equal(response.defaultPair.modelA, MODEL_CATALOG[0].id)
        assert.equal(response.defaultPair.modelB, MODEL_CATALOG[1].id)
        assert.ok(response.models.every((model) => Object.keys(model).length === 3))
        return
    }

    assert.equal(response.mode, "fallback")
    assert.deepEqual(response.defaultPair, { modelA: "cohere", modelB: "groq" })
    assert.deepEqual(
        response.models.map((model) => model.id),
        ["cohere", "groq"],
    )
    assert.ok((response.notice ?? "").includes("OPENROUTER_API_KEY"))
})

test("resolves a valid pair in the requested order", () => {
    if (!catalogMode) return

    const pair = resolveModelPair("deepseek/deepseek-chat", "google/gemini-3.8-flash")

    assert.equal(pair.modelA.id, "deepseek/deepseek-chat")
    assert.equal(pair.modelB.id, "google/gemini-3.8-flash")
})

test("defaults omitted or invalid IDs to the active default pair", () => {
    const omitted = resolveModelPair(undefined, 42)
    const unknown = resolveModelPair("not/a-model", { id: "bad" })

    if (!catalogMode) {
        assert.equal(omitted.modelA.id, "cohere")
        assert.equal(omitted.modelB.id, "groq")
        assert.equal(unknown.modelA.id, "cohere")
        assert.equal(unknown.modelB.id, "groq")
        return
    }

    assert.equal(omitted.modelA.id, MODEL_CATALOG[0].id)
    assert.equal(omitted.modelB.id, MODEL_CATALOG[1].id)
    assert.equal(unknown.modelA.id, MODEL_CATALOG[0].id)
    assert.equal(unknown.modelB.id, MODEL_CATALOG[1].id)
})

test("splits a duplicate pair into two corners", () => {
    if (!catalogMode) return

    const pair = resolveModelPair("openai/gpt-4o-mini", "openai/gpt-4o-mini")

    assert.equal(pair.modelA.id, "openai/gpt-4o-mini")
    assert.notEqual(pair.modelB.id, pair.modelA.id)
})

test("trims model IDs before validating", () => {
    if (!catalogMode) return

    const pair = resolveModelPair("  openai/gpt-4o-mini  ", " mistralai/mistral-large ")

    assert.equal(pair.modelA.id, "openai/gpt-4o-mini")
    assert.equal(pair.modelB.id, "mistralai/mistral-large")
})

test("fallback mode ignores requested OpenRouter IDs", () => {
    if (catalogMode) return

    const pair = resolveModelPair("openai/gpt-4o-mini", "deepseek/deepseek-chat")

    assert.equal(pair.modelA.id, "cohere")
    assert.equal(pair.modelB.id, "groq")
})
