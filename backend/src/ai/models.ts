import config from "../config/config.js"

export type ArenaModel = {
    id: string
    label: string
    provider: string
}

export type ModelPair = {
    modelA: ArenaModel
    modelB: ArenaModel
}

/**
 * Curated OpenRouter catalog. These are the only fighter IDs the arena accepts.
 * Labels are the public names shown on the fight card, not benchmark claims.
 */
export const MODEL_CATALOG: readonly ArenaModel[] = [
    { id: "openai/gpt-4o-mini", label: "GPT-4o-mini", provider: "OpenAI" },
    { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", provider: "Anthropic" },
    { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "Google" },
    { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B Instruct", provider: "Meta" },
    { id: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral AI" },
    { id: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
] as const

export const DEFAULT_MODEL_PAIR = {
    modelA: MODEL_CATALOG[0].id,
    modelB: MODEL_CATALOG[1].id,
} as const

const FALLBACK_FIGHTERS: readonly ArenaModel[] = [
    { id: "cohere", label: "Cohere", provider: "Cohere" },
    { id: "groq", label: "Groq", provider: "Groq" },
] as const

export const isCatalogEnabled = () => Boolean(config.OPENROUTER_API_KEY)

/** The judge runs on a fixed structured-output-friendly model. */
export const JUDGE_MODEL_ID = "openai/gpt-4o-mini"

export const findModel = (id: unknown): ArenaModel | undefined => {
    if (typeof id !== "string") return undefined

    const normalized = id.trim()
    if (!normalized) return undefined

    return MODEL_CATALOG.find((model) => model.id === normalized)
}

/**
 * Resolve a requested pair against the catalog. Missing or unknown IDs fall
 * back to the first two models. Two identical IDs are split so a bout always
 * has two distinct corners.
 */
export const resolveModelPair = (modelA: unknown, modelB: unknown): ModelPair => {
    if (!isCatalogEnabled()) {
        return { modelA: FALLBACK_FIGHTERS[0], modelB: FALLBACK_FIGHTERS[1] }
    }

    const first = MODEL_CATALOG[0]
    const second = MODEL_CATALOG[1]

    const resolvedA = findModel(modelA) ?? first
    let resolvedB = findModel(modelB) ?? second

    if (resolvedB.id === resolvedA.id) {
        resolvedB = MODEL_CATALOG.find((model) => model.id !== resolvedA.id) ?? second
    }

    return { modelA: resolvedA, modelB: resolvedB }
}

export const buildModelsResponse = () => {
    if (!isCatalogEnabled()) {
        return {
            mode: "fallback",
            notice: "OpenRouter is not configured yet. The arena is using Cohere against Groq. Add OPENROUTER_API_KEY on the API to unlock the model catalog.",
            models: FALLBACK_FIGHTERS.map(({ id, label, provider }) => ({ id, label, provider })),
            defaultPair: {
                modelA: FALLBACK_FIGHTERS[0].id,
                modelB: FALLBACK_FIGHTERS[1].id,
            },
        }
    }

    return {
        mode: "openrouter",
        models: MODEL_CATALOG.map(({ id, label, provider }) => ({ id, label, provider })),
        defaultPair: {
            modelA: DEFAULT_MODEL_PAIR.modelA,
            modelB: DEFAULT_MODEL_PAIR.modelB,
        },
    }
}
