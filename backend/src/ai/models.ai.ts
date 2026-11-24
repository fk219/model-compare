import {ChatGoogle} from "@langchain/google";
import {ChatMistralAI} from "@langchain/mistralai";
import {ChatCohere} from "@langchain/cohere";
import {ChatGroq} from "@langchain/groq";
import {ChatOpenAI} from "@langchain/openai";
import config from "../config/config.js";
import {JUDGE_MODEL_ID} from "./models.js";

// Every client is guarded so the API boots with either an OpenRouter key or
// the Cohere and Groq fallback pair. Gemini and Mistral stay optional.
const geminiModel = config.GOOGLE_API_KEY
    ? new ChatGoogle({
        model: "gemini-flash-latest",
        apiKey: config.GOOGLE_API_KEY,
    })
    : null

const mistralModel = config.MISTRALAI_API_KEY
    ? new ChatMistralAI({
        model: "mistral-medium-latest",
        apiKey: config.MISTRALAI_API_KEY,
    })
    : null

const cohereModel = config.COHERE_API_KEY
    ? new ChatCohere({
        model: "command-r7b-12-2024",
        apiKey: config.COHERE_API_KEY,
    })
    : null

const groqModel = config.GROQ_API_KEY
    ? new ChatGroq({
        model: "openai/gpt-oss-120b",
        apiKey: config.GROQ_API_KEY,
    })
    : null

export const isOpenRouterEnabled = () => Boolean(config.OPENROUTER_API_KEY)

export const getFallbackFighters = () => {
    if (!cohereModel || !groqModel) {
        throw new Error(
            "The fallback arena needs COHERE_API_KEY and GROQ_API_KEY. Add OPENROUTER_API_KEY to use the model catalog.",
        )
    }

    return { cohereModel, groqModel }
}

export const getFallbackJudge = () => {
    if (!groqModel) {
        throw new Error(
            "The fallback judge needs GROQ_API_KEY. Add OPENROUTER_API_KEY to use the model catalog.",
        )
    }

    return groqModel
}

/**
 * One client per fighter. OpenRouter is OpenAI-compatible, so ChatOpenAI is
 * pointed at the OpenRouter base URL with attribution headers.
 */
export const createOpenRouterModel = (modelId: string, temperature = 0.7) =>
    new ChatOpenAI({
        model: modelId,
        apiKey: config.OPENROUTER_API_KEY,
        temperature,
        configuration: {
            baseURL: config.OPENROUTER_BASE_URL,
            defaultHeaders: {
                "HTTP-Referer": config.OPENROUTER_HTTP_REFERER,
                "X-Title": config.OPENROUTER_APP_TITLE,
            },
        },
    })

export const createOpenRouterJudge = () => createOpenRouterModel(JUDGE_MODEL_ID, 0)

export {
    geminiModel,
    mistralModel,
    cohereModel,
    groqModel
}
