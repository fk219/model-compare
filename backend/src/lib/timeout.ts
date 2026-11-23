export class UpstreamTimeoutError extends Error {
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`Upstream work exceeded ${timeoutMs}ms`)
    this.name = "UpstreamTimeoutError"
    this.timeoutMs = timeoutMs
  }
}

/**
 * Bounds how long a request may hold the connection. Note that Promise.race
 * does not cancel the underlying model calls; it only stops the client waiting.
 */
export const withTimeout = async <T>(work: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new UpstreamTimeoutError(timeoutMs)), timeoutMs)
  })

  try {
    return await Promise.race([work, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
