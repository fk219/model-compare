export const MAX_PROMPT_LENGTH = 2000

export type PromptValidation =
  | { ok: true; prompt: string; cacheKey: string }
  | { ok: false; error: string; code: "INVALID_PROMPT" | "PROMPT_TOO_LONG" }

/**
 * Cache key normalization. Trim and Unicode-normalize, but keep internal
 * whitespace intact because prompts can contain indentation-sensitive code.
 */
export const normalizePrompt = (prompt: string) => prompt.normalize("NFC").trim()

export const validatePrompt = (value: unknown): PromptValidation => {
  if (typeof value !== "string" || !value.trim()) {
    return {
      ok: false,
      error: "problem must be a non-empty string",
      code: "INVALID_PROMPT",
    }
  }

  if (value.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      error: `Prompt is too long. Keep it under ${MAX_PROMPT_LENGTH.toLocaleString("en-US")} characters.`,
      code: "PROMPT_TOO_LONG",
    }
  }

  const prompt = value.trim()

  return {
    ok: true,
    prompt,
    cacheKey: normalizePrompt(prompt),
  }
}
