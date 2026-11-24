import { FighterPicker } from "./FighterPicker.jsx"

const STARTER_PROMPTS = [
  "Explain event delegation in JavaScript.",
  "Write a SQL query to find duplicate emails.",
  "Refactor a callback pyramid into async/await.",
  "Design a rate limiter for an API.",
  "Debug a React effect that runs twice.",
  "Compare REST and GraphQL for a mobile app.",
]

const STEPS = [
  ["01", "Write the prompt", "One problem for both models."],
  ["02", "Read both answers", "Side by side, same brief."],
  ["03", "Get the verdict", "The judge scores each answer."],
]

const EmptyState = ({
  chatCount,
  onPickPrompt,
  models,
  modelA,
  modelB,
  onChangeModelA,
  onChangeModelB,
  modelALabel,
  modelBLabel,
  modelMode = "openrouter",
  modelNotice = "",
}) => {
  return (
    <section className="empty" aria-labelledby="empty-title">
      <p className="empty__eyebrow">{chatCount === 0 ? "First bout" : "Next bout"}</p>

      <h2 id="empty-title" className="empty__title">
        Pick a fight.
        <br />
        <span className="empty__hollow">Get a verdict.</span>
      </h2>

      <p className="empty__copy">
        {modelALabel} and {modelBLabel} answer the same prompt. A judge scores both out of
        ten and calls the winner. Every bout stays on your card.
      </p>

      <FighterPicker
        models={models}
        modelA={modelA}
        modelB={modelB}
        onChangeA={onChangeModelA}
        onChangeB={onChangeModelB}
        mode={modelMode}
        notice={modelNotice}
      />

      <div className="starters">
        <p className="starters__label">Start with a prompt</p>
        <ul className="starters__list">
          {STARTER_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                className="starter-chip"
                onClick={() => onPickPrompt(prompt)}
              >
                <span className="starter-chip__plus" aria-hidden="true">
                  +
                </span>
                {prompt}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="steps" aria-label="How a battle works">
        {STEPS.map(([number, title, copy]) => (
          <div key={number} className="step">
            <span className="step__num">{number}</span>
            <p className="step__body">
              <span className="step__title">{title}</span>
              <span className="step__copy">{copy}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export { EmptyState }
