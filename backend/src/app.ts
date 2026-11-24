import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import startGraph, { type BattleResult } from './ai/graph.ai.js'
import { buildModelsResponse, resolveModelPair } from './ai/models.js'
import { LruTtlCache } from './lib/lruCache.js'
import { createInvokeLimiter } from './lib/rateLimit.js'
import { buildBattleCacheKey, validatePrompt } from './lib/prompt.js'
import { UpstreamTimeoutError, withTimeout } from './lib/timeout.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || [
    'http://localhost:5172',
    'http://localhost:5173',
    'https://ai-battle-arena.furqankhan.dev'
].join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const INVOKE_TIMEOUT_MS = 60_000
const CACHE_MAX_ENTRIES = 100
const CACHE_TTL_MS = 30 * 60 * 1000

const battleCache = new LruTtlCache<BattleResult>(CACHE_MAX_ENTRIES, CACHE_TTL_MS)

const perMinuteLimiter = createInvokeLimiter(60 * 1000, 6)
const perHourLimiter = createInvokeLimiter(60 * 60 * 1000, 40)

// Render (and most hosts) terminate TLS at one proxy in front of the app.
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet())
app.use(compression())
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
}))
app.use(express.json({ limit: '16kb' }))


app.get('/', (_req, res) => {
    res.send('API is up and running')
})

app.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true,
        uptime: Math.round(process.uptime())
    })
})

app.get('/api/models', (_req, res) => {
    res.status(200).json(buildModelsResponse())
})

app.post('/api/invoke', perMinuteLimiter, perHourLimiter, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
        problem?: unknown
        modelA?: unknown
        modelB?: unknown
    }
    const validation = validatePrompt(body.problem)

    if (!validation.ok) {
        return res.status(400).json({
            error: validation.error,
            code: validation.code
        })
    }

    const { prompt } = validation
    const pair = resolveModelPair(body.modelA, body.modelB)
    const cacheKey = buildBattleCacheKey(prompt, pair.modelA.id, pair.modelB.id)
    const cachedResult = battleCache.get(cacheKey)

    if (cachedResult) {
        return res.status(200).json({
            message: "Graph Executed Successfully!",
            success: true,
            cached: true,
            result: cachedResult
        })
    }

    try {
        const result = await withTimeout(startGraph(prompt, pair), INVOKE_TIMEOUT_MS)
        battleCache.set(cacheKey, result)

        res.status(200).json({
            message: "Graph Executed Successfully!",
            success: true,
            cached: false,
            result
        })
    } catch (error: unknown) {
        if (error instanceof UpstreamTimeoutError) {
            console.error("Arena timeout:", error.message)

            return res.status(504).json({
                error: "The bout timed out. The models took too long, so try a shorter prompt.",
                code: "TIMEOUT"
            })
        }

        console.error("Arena error:", error)

        res.status(500).json({
            error: error instanceof Error ? error.message : "Something went wrong in the arena"
        })
    }
})

// Keep parser failures JSON-shaped so the client can show its normal banner.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const details = error as { type?: string; status?: number; message?: string }

    if (details?.type === 'entity.too.large') {
        return res.status(400).json({
            error: "Request body is too large. Prompts are capped at 2,000 characters.",
            code: "PAYLOAD_TOO_LARGE"
        })
    }

    if (details?.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: "Request body must be valid JSON.",
            code: "INVALID_JSON"
        })
    }

    console.error("Unhandled arena error:", error)

    res.status(details?.status ?? 500).json({
        error: "Something went wrong in the arena"
    })
})

export { app }
