import { useEffect, useRef } from "react"
import {
  formatBattleDate,
  formatBoutNumber,
  getBattleDate,
  getBattleOutcome,
} from "../lib/battles"

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      d="M3 3l10 10M13 3L3 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const FightCard = ({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onClose,
  loading,
  open,
  isMobile,
  closeButtonRef,
}) => {
  const activeItemRef = useRef(null)
  const railScrollRef = useRef(null)

  useEffect(() => {
    const container = railScrollRef.current
    const item = activeItemRef.current
    if (!container || !item) return

    const itemRect = item.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    if (itemRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - itemRect.top + 8
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom + 8
    }
  }, [activeChatId])

  return (
    <aside
      id="fight-card"
      className={`rail${open ? " rail--open" : ""}`}
      aria-label="Fight card"
      role={isMobile ? "dialog" : undefined}
      aria-modal={isMobile && open ? true : undefined}
      inert={isMobile && !open}
    >
      <div className="rail__head">
        <span className="rail__mark" aria-hidden="true">
          ×
        </span>
        <div className="rail__heading">
          <p className="rail__title">Fight card</p>
          <p className="rail__sub">Every bout on record</p>
        </div>
        <button
          type="button"
          ref={closeButtonRef}
          className="rail__close"
          onClick={onClose}
          aria-label="Close fight card"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="rail__summary">
        <span>On the card</span>
        <span className="rail__count">{String(chats.length).padStart(2, "0")}</span>
      </div>

      <div className="rail__scroll" ref={railScrollRef}>
        {chats.length === 0 ? (
          <p className="rail__empty">No bouts yet. Send the first prompt to open the card.</p>
        ) : (
          <ol className="rail__list">
            {chats.map((chat, index) => {
              const isActive = chat.id === activeChatId
              const outcome = getBattleOutcome(chat)
              const date = getBattleDate(chat)

              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    ref={isActive ? activeItemRef : undefined}
                    className={`bout-link${isActive ? " is-active" : ""}`}
                    onClick={() => onSelect(chat.id)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="bout-link__num">{formatBoutNumber(index)}</span>
                    <span className="bout-link__body">
                      <span className="bout-link__title">{chat.title}</span>
                      <time className="bout-link__time" dateTime={date ? date.toISOString() : undefined}>
                        {formatBattleDate(date)}
                      </time>
                    </span>
                    <span className="bout-link__status">
                      <span className={`status-dot status-dot--${outcome.tone}`} aria-hidden="true" />
                      <span className="sr-only">{outcome.label}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="rail__foot">
        <button type="button" className="btn-new" onClick={onNew} disabled={loading}>
          <span>New battle</span>
          <span className="btn-new__plus" aria-hidden="true">
            +
          </span>
        </button>
        <p className="rail__note">Bouts stay on this device</p>
      </div>
    </aside>
  )
}

export { FightCard }
