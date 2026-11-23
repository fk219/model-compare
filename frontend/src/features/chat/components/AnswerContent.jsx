import { parseAnswer } from "../lib/battles"

const AnswerContent = ({ text }) => {
  const source = typeof text === "string" ? text : ""

  if (!source.trim()) {
    return <p className="answer__empty">No answer came back for this corner.</p>
  }

  const parts = parseAnswer(source)

  return parts.map((part, index) =>
    part.type === "code" ? (
      <pre key={index} className="answer__code">
        {part.content}
      </pre>
    ) : (
      <p key={index} className="answer__text">
        {part.content}
      </p>
    )
  )
}

export { AnswerContent }
