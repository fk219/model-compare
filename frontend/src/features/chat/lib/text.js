export const compactText = (value, maxLength = 220) => {
  if (typeof value !== "string") return ""

  const text = value.replace(/\s+/g, " ").trim()
  if (text.length <= maxLength) return text

  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(" ")
  const readable = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut

  return `${readable.trimEnd()}…`
}
