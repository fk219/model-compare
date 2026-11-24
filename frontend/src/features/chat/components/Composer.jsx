import { useEffect } from "react"
import { MAX_PROMPT_LENGTH } from "../lib/limits"
import { LegalLinks } from "../../legal/components/LegalLinks.jsx"

const SendIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
    <path
      d="M2.5 8h10M8.5 3.5L13 8l-4.5 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Composer = ({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  onDismissError,
  inputRef,
  sameModel = false,
}) => {
  useEffect(() => {
    const field = inputRef.current
    if (!field) return

    field.style.height = "auto"
    field.style.height = `${Math.min(field.scrollHeight, 144)}px`
  }, [value, inputRef])

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    onSubmit()
  }

  const nearLimit = value.length >= 1600

  return (
    <footer className="composer">
      <div className="composer__inner">
        {error ? (
          <div className="alert" role="alert">
            <span className="alert__mark" aria-hidden="true">
              !
            </span>
            <div className="alert__body">
              <p className="alert__title">The battle didn't start</p>
              <p className="alert__message">{error}</p>
            </div>
            <div className="alert__actions">
              <button
                type="button"
                className="alert__retry"
                onClick={onSubmit}
                disabled={loading || !value.trim() || sameModel}
              >
                Retry
              </button>
              <button type="button" className="alert__dismiss" onClick={onDismissError}>
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <form
          className="composer__form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label className="sr-only" htmlFor="battle-prompt">
            Battle prompt
          </label>
          <textarea
            id="battle-prompt"
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a problem."
            className="composer__input"
            maxLength={MAX_PROMPT_LENGTH}
            aria-describedby="composer-hint"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={loading || !value.trim() || sameModel}
            aria-label={
              sameModel
                ? "Pick two different fighters to send"
                : loading
                  ? "Battle in progress"
                  : "Send prompt"
            }
          >
            <span>{loading ? "Sending" : "Send"}</span>
            <SendIcon />
          </button>
        </form>

        <div className="composer__hint">
          <span id="composer-hint">
            Enter to send · Shift + Enter for a new line
            {nearLimit ? (
              <span className={`composer__count${value.length >= 1900 ? " is-near" : ""}`}>
                {" "}
                · {value.length.toLocaleString("en-US")}/{MAX_PROMPT_LENGTH.toLocaleString("en-US")}
              </span>
            ) : null}
          </span>
          <span className="composer__meta">
            <span className="composer__note">Bouts stay on this device</span>
            <LegalLinks />
          </span>
        </div>
      </div>
    </footer>
  )
}

export { Composer }
