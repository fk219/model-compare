import { useEffect, useRef, useState } from "react"
import { formatBattleDate, formatScore, getBattleDate } from "../lib/battles"
import { AnswerContent } from "./AnswerContent.jsx"

const CopyIcon = ({ copied }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    {copied ? (
      <path
        d="M2.5 8.5l3.5 3.5 7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <>
        <rect
          x="5.5"
          y="5.5"
          width="8"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M10.5 3.5v-.5a1 1 0 00-1-1h-7a1 1 0 00-1 1v7a1 1 0 001 1h.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
)

const copyToClipboard = async (text) => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable")
    await navigator.clipboard.writeText(text)
  } catch {
    // The API can be blocked in insecure contexts, so fall back to a temporary field.
    const helper = document.createElement("textarea")
    helper.value = text
    helper.setAttribute("readonly", "")
    helper.style.position = "fixed"
    helper.style.top = "-9999px"
    document.body.appendChild(helper)

    try {
      helper.select()
      const didCopy = document.execCommand("copy")
      if (!didCopy) throw new Error("Copy command failed")
    } finally {
      helper.remove()
    }
  }
}

const BattleView = ({ chat, boutNumber, isFresh }) => {
  const [copiedKey, setCopiedKey] = useState(null)
  const copyTimerRef = useRef(null)

  useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current)
  }, [])

  const handleCopy = async (key, text) => {
    try {
      await copyToClipboard(text ?? "")
      setCopiedKey(key)
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setCopiedKey(null)
    }
  }

  const userMessage = chat.messages.find((message) => message.role === "user")
  const resultMessage = chat.messages.find((message) => message?.result)
  const errorMessage = chat.messages.find((message) => message?.error)
  const battleDate = getBattleDate(chat)

  if (errorMessage) {
    return (
      <article className="bout" aria-label={`Bout ${boutNumber}`}>
        <div className="bout-error" role="alert">
          {errorMessage.error}
        </div>
      </article>
    )
  }

  if (!resultMessage?.result) {
    return (
      <article className="bout" aria-label={`Bout ${boutNumber}`}>
        <div className="bout-pending">The result hasn't landed yet. Give it a moment.</div>
      </article>
    )
  }

  const { solution_1, solution_2 } = resultMessage.result
  const judge = resultMessage.result.judge ?? {}
  const winner = judge.winner
  const isTie = winner !== "solution_1" && winner !== "solution_2"
  const winnerLabel =
    winner === "solution_1" ? "Cohere wins" : winner === "solution_2" ? "Groq wins" : "Draw"

  const corners = [
    {
      key: "solution_1",
      name: "Cohere",
      cornerLabel: "Red corner",
      tone: "red",
      text: solution_1,
      score: judge.solution_1_score,
      isWinner: winner === "solution_1",
    },
    {
      key: "solution_2",
      name: "Groq",
      cornerLabel: "Blue corner",
      tone: "blue",
      text: solution_2,
      score: judge.solution_2_score,
      isWinner: winner === "solution_2",
    },
  ]

  const renderCorner = ({ key, name, cornerLabel, tone, text, score, isWinner }) => {
    const isCopied = copiedKey === key

    return (
      <article
        key={key}
        className={`corner corner--${tone}${isWinner ? " corner--winner" : ""}`}
        aria-label={`${name} answer`}
      >
        <header className="corner__head">
          <div className="corner__identity">
            <p className="corner__kicker">
              <span className="corner__stripe" aria-hidden="true" />
              {cornerLabel}
            </p>
            <h3 className="corner__name">{name}</h3>
          </div>

          <div className="corner__aside">
            {isWinner ? <span className="ribbon">Winner</span> : null}
            <span className="corner__score">
              <span aria-hidden="true">{formatScore(score)}</span>
              <small aria-hidden="true">/10</small>
              <span className="sr-only">{name} score {formatScore(score)} out of 10</span>
            </span>
          </div>
        </header>

        <div className="corner__body">
          <AnswerContent text={text} />
        </div>

        <footer className="corner__foot">
          <button
            type="button"
            className={`copy-btn${isCopied ? " is-copied" : ""}`}
            onClick={() => handleCopy(key, text)}
            aria-label={isCopied ? `${name} answer copied` : `Copy ${name} answer`}
          >
            <CopyIcon copied={isCopied} />
            <span>{isCopied ? "Copied" : "Copy answer"}</span>
          </button>
        </footer>
      </article>
    )
  }

  return (
    <article className="bout" aria-label={`Bout ${boutNumber}: ${chat.title}`}>
      <header className="bout__head">
        <p className="bout__kicker">
          <span className="bout__number">Bout {boutNumber}</span>
          <span className="bout__slash" aria-hidden="true">
            /
          </span>
          <time dateTime={battleDate ? battleDate.toISOString() : undefined}>
            {formatBattleDate(battleDate)}
          </time>
        </p>
        <span className="bout__tag">Final</span>
      </header>

      <section className="prompt-card" aria-labelledby={`prompt-${chat.id}`}>
        <h2 id={`prompt-${chat.id}`} className="prompt-card__label">
          The prompt
        </h2>
        <p className="prompt-card__text">{userMessage?.content ?? chat.title}</p>
      </section>

      <div className={`result${isFresh ? " result--fresh" : ""}`}>
        <section className="scorecard" aria-label="Judges' scorecard">
          <div className="scorecard__top">
            <span>Judges' scorecard</span>
            <span className="scorecard__bout">Bout {boutNumber} · Final</span>
          </div>

          <div className="scorecard__grid">
            <div
              className={`score score--red${corners[0].isWinner ? " is-winner" : ""}`}
            >
              <span className="score__name">Cohere</span>
              <span className="score__value">
                <span aria-hidden="true">{formatScore(corners[0].score)}</span>
                <small aria-hidden="true">/10</small>
                <span className="sr-only">
                  Cohere score {formatScore(corners[0].score)} out of 10
                </span>
              </span>
            </div>

            <div className={`verdict${isTie ? " verdict--draw" : ""}`}>
              <span className="verdict__label">Decision</span>
              <span className="verdict__text">{winnerLabel}</span>
            </div>

            <div
              className={`score score--blue${corners[1].isWinner ? " is-winner" : ""}`}
            >
              <span className="score__name">Groq</span>
              <span className="score__value">
                <span aria-hidden="true">{formatScore(corners[1].score)}</span>
                <small aria-hidden="true">/10</small>
                <span className="sr-only">
                  Groq score {formatScore(corners[1].score)} out of 10
                </span>
              </span>
            </div>
          </div>
        </section>

        <div className="duel">
          {renderCorner(corners[0])}

          <div className="seam" aria-hidden="true">
            <span className="seam__badge">VS</span>
          </div>

          {renderCorner(corners[1])}
        </div>
      </div>
    </article>
  )
}

export { BattleView }
