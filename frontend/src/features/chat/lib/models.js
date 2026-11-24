const MODEL_PAIR_STORAGE_KEY = "ai-battle-arena:model-pair:v1"

export const FALLBACK_MODELS = Object.freeze([
  { id: "openai/gpt-4o-mini", label: "GPT-4o-mini", provider: "OpenAI" },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", provider: "Anthropic" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "Google" },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B Instruct", provider: "Meta" },
  { id: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral AI" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
])

export const FALLBACK_FIGHTERS = Object.freeze([
  { id: "cohere", label: "Cohere", provider: "Cohere" },
  { id: "groq", label: "Groq", provider: "Groq" },
])

export const normalizeModels = (value) => {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const models = []

  value.forEach((entry) => {
    if (!entry || typeof entry !== "object") return

    const id = typeof entry.id === "string" ? entry.id.trim() : ""
    const label = typeof entry.label === "string" ? entry.label.trim() : ""
    if (!id || !label || seen.has(id)) return

    const provider =
      typeof entry.provider === "string" && entry.provider.trim()
        ? entry.provider.trim()
        : "Other"

    seen.add(id)
    models.push({ id, label, provider })
  })

  return models
}

export const resolveModelPair = (pair, models = FALLBACK_MODELS) => {
  const catalog = normalizeModels(models)
  const fallbackA = catalog[0]?.id ?? ""
  const fallbackB = catalog[1]?.id ?? fallbackA

  const requestedA = typeof pair?.modelA === "string" ? pair.modelA : ""
  const requestedB = typeof pair?.modelB === "string" ? pair.modelB : ""
  const modelA = catalog.some((model) => model.id === requestedA) ? requestedA : fallbackA
  let modelB = catalog.some((model) => model.id === requestedB) ? requestedB : fallbackB

  if (modelB === modelA) {
    modelB = catalog.find((model) => model.id !== modelA)?.id ?? modelB
  }

  return { modelA, modelB }
}

export const loadModelPair = (models = FALLBACK_MODELS) => {
  const fallback = resolveModelPair(null, models)
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(MODEL_PAIR_STORAGE_KEY)
    if (!raw) return fallback

    return resolveModelPair(JSON.parse(raw), models)
  } catch {
    return fallback
  }
}

export const saveModelPair = (modelA, modelB) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      MODEL_PAIR_STORAGE_KEY,
      JSON.stringify({ modelA, modelB }),
    )
  } catch (error) {
    console.warn("Could not save the fighter pair:", error)
  }
}

export const getModelLabel = (models, id) => {
  const model = normalizeModels(models).find((entry) => entry.id === id)
  if (model) return model.label
  return typeof id === "string" && id ? id : "Unknown fighter"
}
