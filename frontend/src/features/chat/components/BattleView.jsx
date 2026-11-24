import { useEffect, useRef, useState } from "react"
import {
  formatBattleDate,
  formatScore,
  getBattleDate,
  getBattleModelLabels,
  getCornerFeedback,
  getVerdictLine,
} from "../lib/battles"
import { downloadBattleReport } from "../lib/report"
import { createShareUrl, ShareError } from "../lib/share"
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

const ShareIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <circle cx="4" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="12" cy="3.5" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="12" cy="12.5" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M5.5 7.2l5-2.7M5.5 8.8l5 2.7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path
      d="M8 2v7.5M5 7l3 3 3-3M3 12.5h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  const [shareStatus, setShareStatus] = useState(null)
  const copyTimerRef = useRef(null)
  const shareTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      window.clearTimeout(copyTimerRef.current)
      window.clearTimeout(shareTimerRef.current)
    }
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

  const pushShareStatus = (tone, message) => {
    setShareStatus({ tone, message })
    window.clearTimeout(shareTimerRef.current)
    shareTimerRef.current = window.setTimeout(() => setShareStatus(null), 6000)
  }

  const handleShare = async () => {
    try {
      const url = createShareUrl(chat)
      window.history.replaceState(null, "", url)

      try {
        await copyToClipboard(url)
        pushShareStatus("success", "Share link copied. The report is also in the address bar.")
      } catch {
        pushShareStatus(
          "error",
          "The report link is in the address bar, but copying it failed. Copy it from there.",
        )
      }
    } catch (error) {
      pushShareStatus(
        "error",
        error instanceof ShareError
          ? error.message
          : "The report couldn't be shared as a link. Use Export report instead.",
      )
    }
  }

  const handleExport = () => {
    try {
      const filename = downloadBattleReport(chat)
      pushShareStatus("success", `Downloaded ${filename}.`)
    } catch {
      pushShareStatus("error", "The report couldn't be exported. Try again.")
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
  const labels = getBattleModelLabels(resultMessage.result)
  const winner = judge.winner
  const isTie = winner !== "solution_1" && winner !== "solution_2"
  const winnerLabel =
    winner === "solution_1"
      ? `${labels.model1} wins`
      : winner === "solution_2"
        ? `${labels.model2} wins`
        : "Draw"
  const verdictLine = getVerdictLine(judge, labels)
  const firstFeedback = getCornerFeedback(judge, "solution_1")
  const secondFeedback = getCornerFeedback(judge, "solution_2")
  const hasEvidence = Boolean(firstFeedback || secondFeedback)

  const corners = [
    {
      key: "solution_1",
      name: labels.model1,
      cornerLabel: "Red corner",
      tone: "red",
      text: solution_1,
      score: judge.solution_1_score,
      isWinner: winner === "solution_1",
    },
    {
      key: "solution_2",
      name: labels.model2,
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

        <div className="bout__tools">
          <div className="bout__actions">
            <button type="button" className="report-btn" onClick={handleShare}>
              <ShareIcon />
              <span>Share report</span>
            </button>
            <button type="button" className="report-btn" onClick={handleExport}>
              <DownloadIcon />
              <span>Export report</span>
            </button>
          </div>
          <span className="bout__tag">Final</span>
        </div>
      </header>

      {shareStatus ? (
        <p className={`bout__notice bout__notice--${shareStatus.tone}`} role="status" aria-live="polite">
          {shareStatus.message}
        </p>
      ) : null}

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
              <span className="score__name">{labels.model1}</span>
              <span className="score__value">
                <span aria-hidden="true">{formatScore(corners[0].score)}</span>
                <small aria-hidden="true">/10</small>
                <span className="sr-only">
                  {labels.model1} score {formatScore(corners[0].score)} out of 10
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
              <span className="score__name">{labels.model2}</span>
              <span className="score__value">
                <span aria-hidden="true">{formatScore(corners[1].score)}</span>
                <small aria-hidden="true">/10</small>
                <span className="sr-only">
                  {labels.model2} score {formatScore(corners[1].score)} out of 10
                </span>
              </span>
            </div>
          </div>

          {verdictLine ? (
            <p className="verdict-reason">
              <span className="verdict-reason__label">{verdictLine.label}</span>
              <span className="verdict-reason__text">{verdictLine.text}</span>
            </p>
          ) : null}

          {hasEvidence ? (
            <div className="scorecard__notes" role="group" aria-label="Judge reasoning">
              <div className="scorecard__note scorecard__note--red">
                <p className="scorecard__note-label">Judge on {labels.model1}</p>
                <p className="scorecard__note-text">
                  {firstFeedback || "No reasoning was returned for this corner."}
                </p>
              </div>
              <div className="scorecard__note scorecard__note--blue">
                <p className="scorecard__note-label">Judge on {labels.model2}</p>
                <p className="scorecard__note-text">
                  {secondFeedback || "No reasoning was returned for this corner."}
                </p>
              </div>
            </div>
          ) : null}
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
