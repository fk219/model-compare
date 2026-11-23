import type { Request } from "express"
import { rateLimit, type RateLimitInfo } from "express-rate-limit"

const retryAfterSeconds = (request: Request, windowMs: number) => {
  const info = (request as Request & { rateLimit?: RateLimitInfo }).rateLimit
  const resetAt = info?.resetTime?.getTime() ?? Date.now() + windowMs

  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
}

/**
 * One limiter per window. Both are mounted on /api/invoke, so a client can
 * burst up to 6 in a minute and use at most 40 across an hour.
 */
export const createInvokeLimiter = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (request, response) => {
      const retryAfter = retryAfterSeconds(request, windowMs)

      response.setHeader("Retry-After", String(retryAfter))
      response.status(429).json({
        error: `Arena is at capacity. Try again in ${retryAfter}s.`,
        retryAfter,
      })
    },
  })
