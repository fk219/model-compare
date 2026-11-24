import { useId } from "react"

const groupByProvider = (models) => {
  const groups = []
  const byProvider = new Map()

  models.forEach((model) => {
    if (!byProvider.has(model.provider)) {
      const group = { provider: model.provider, models: [] }
      byProvider.set(model.provider, group)
      groups.push(group)
    }
    byProvider.get(model.provider).models.push(model)
  })

  return groups
}

const FighterSelect = ({ id, label, value, models, onChange, disabled }) => (
  <div className="fighter-field">
    <label className="fighter-field__label" htmlFor={id}>
      {label}
    </label>
    <select
      id={id}
      className="fighter-field__select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {groupByProvider(models).map((group) => (
        <optgroup key={group.provider} label={group.provider}>
          {group.models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  </div>
)

const FighterPicker = ({
  models,
  modelA,
  modelB,
  onChangeA,
  onChangeB,
  compact = false,
  disabled = false,
  mode = "openrouter",
  notice = "",
}) => {
  const id = useId()
  const isSameModel = Boolean(modelA && modelB && modelA === modelB)
  const locked = mode !== "openrouter"
  const statusText = notice || (mode === "loading" ? "Loading fighters." : "")
  const heading = compact
    ? "Next bout"
    : mode === "fallback"
      ? "Current fighters"
      : "Choose two fighters"

  return (
    <section
      className={`fighters${compact ? " fighters--compact" : ""}`}
      aria-label="Fighters"
    >
      <div className="fighters__head">
        <p className="fighters__label">{heading}</p>
        {compact ? null : (
          <p className="fighters__hint">
            {locked
              ? "Model selection unlocks when the OpenRouter key is added."
              : "One prompt, two models, one verdict."}
          </p>
        )}
      </div>

      <div className="fighters__fields">
        <FighterSelect
          id={`${id}-a`}
          label="Fighter A"
          value={modelA}
          models={models}
          onChange={onChangeA}
          disabled={disabled || locked}
        />

        <span className="fighters__vs" aria-hidden="true">
          VS
        </span>

        <FighterSelect
          id={`${id}-b`}
          label="Fighter B"
          value={modelB}
          models={models}
          onChange={onChangeB}
          disabled={disabled || locked}
        />
      </div>

      {statusText ? (
        <p className="fighters__note" role="status">
          {statusText}
        </p>
      ) : null}

      {isSameModel && !locked ? (
        <p className="fighters__note" role="status">
          Pick two different fighters to start a bout.
        </p>
      ) : null}
    </section>
  )
}

export { FighterPicker }
