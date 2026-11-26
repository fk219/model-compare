import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    OPENROUTER_HTTP_REFERER: process.env.OPENROUTER_HTTP_REFERER || "https://modelcompare.furqankhan.dev",
    OPENROUTER_APP_TITLE: process.env.OPENROUTER_APP_TITLE || "ModelCompare",
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
    MISTRALAI_API_KEY: process.env.MISTRALAI_API_KEY || "",
    COHERE_API_KEY: process.env.COHERE_API_KEY || "",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
}

export default config;
