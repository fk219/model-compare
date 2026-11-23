import { useEffect, useRef, useState } from "react"
import startBattle from "../services/chat.api"
import {
  describeBattleError,
  formatBoutNumber,
  loadFightCard,
  saveFightCard,
} from "../lib/battles"
import { MAX_PROMPT_LENGTH } from "../lib/limits"
import { clearShareHash, readSharedReport } from "../lib/share"
import { BattleView } from "../components/BattleView.jsx"
import { Composer } from "../components/Composer.jsx"
import { EmptyState } from "../components/EmptyState.jsx"
import { FightCard } from "../components/FightCard.jsx"
import { LiveBout } from "../components/LiveBout.jsx"
import { SharedReportPage } from "./SharedReportPage.jsx"

const MenuIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
    <path
      d="M2 4.5h12M2 8h12M2 11.5h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const ArenaPage = () => {
  // ----- 1. STATE ------------------------------------------------
  // All state lives here at the top. Nothing is duplicated in children.
  const [savedCard] = useState(loadFightCard)
  const [chats, setChats] = useState(savedCard.chats)
  const [activeChatId, setActiveChatId] = useState(savedCard.activeChatId)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingProblem, setPendingProblem] = useState("")
  const [freshBattleId, setFreshBattleId] = useState(null)

  const [railOpen, setRailOpen] = useState(false)
  const [isMobileRail, setIsMobileRail] = useState(
    () => window.matchMedia("(max-width: 900px)").matches,
  )

  const textareaRef = useRef(null)
  const scrollRef = useRef(null)
  const railToggleRef = useRef(null)
  const railCloseRef = useRef(null)

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null
  const activeIndex = activeChat
    ? chats.findIndex((chat) => chat.id === activeChat.id)
    : -1

  // ----- 2. HANDLERS -----------------------------------------------

  const closeRail = () => {
    setRailOpen(false)
    if (isMobileRail) railToggleRef.current?.focus()
  }

  const selectChat = (id) => {
    clearShareHash()
    setActiveChatId(id)
    setFreshBattleId(null)
    setError(null)
    closeRail()
  }

  const startNewChat = () => {
    clearShareHash()
    setActiveChatId(null)
    setFreshBattleId(null)
    setError(null)
    closeRail()
  }

  const handleSend = async () => {
    const problem = inputValue.trim()
    if (!problem || loading) return

    if (problem.length > MAX_PROMPT_LENGTH) {
      setError(`Prompts are capped at ${MAX_PROMPT_LENGTH.toLocaleString("en-US")} characters. Trim it down and try again.`)
      return
    }

    clearShareHash()
    setError(null)
    setPendingProblem(problem)

    try {
      setLoading(true)
      const data = await startBattle(problem)
      const chatId = Date.now().toString()

      setChats((currentChats) => [
        ...currentChats,
        {
          id: chatId,
          title: problem,
          createdAt: new Date().toISOString(),
          messages: [
            { id: `${chatId}-question`, role: "user", content: problem },
            { id: `${chatId}-result`, result: data.result },
          ],
        },
      ])
      setActiveChatId(chatId)
      setFreshBattleId(chatId)
      setInputValue("")
    } catch (requestError) {
      console.error("Battle request failed:", requestError)
      setError(describeBattleError(requestError))
    } finally {
      setLoading(false)
    }
  }

  const pickPrompt = (prompt) => {
    setInputValue(prompt)
    textareaRef.current?.focus()
  }

  // ----- 3. EFFECTS -------------------------------------------------

  useEffect(() => {
    saveFightCard(chats, activeChatId)
  }, [chats, activeChatId])

  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)")

    const syncRailMode = (event) => {
      setIsMobileRail(event.matches)
      if (!event.matches) setRailOpen(false)
    }

    query.addEventListener("change", syncRailMode)
    return () => query.removeEventListener("change", syncRailMode)
  }, [])

  useEffect(() => {
    if (!railOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return
      setRailOpen(false)
      railToggleRef.current?.focus()
    }

    document.addEventListener("keydown", handleKeyDown)
    if (isMobileRail) railCloseRef.current?.focus()

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [railOpen, isMobileRail])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
  }, [activeChatId, loading])

  // ----- 4. RENDER ---------------------------------------------------

  return (
    <div className="arena">
      <FightCard
        chats={chats}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNew={startNewChat}
        onClose={closeRail}
        loading={loading}
        open={railOpen}
        isMobile={isMobileRail}
        closeButtonRef={railCloseRef}
      />

      {railOpen ? (
        <div className="rail-scrim" aria-hidden="true" onClick={closeRail} />
      ) : null}

      <main className="stage">
        <header className="marquee">
          <div className="marquee__lead">
            <button
              type="button"
              ref={railToggleRef}
              className="card-toggle"
              onClick={() => setRailOpen(true)}
              aria-label={`Open fight card, ${chats.length} ${chats.length === 1 ? "bout" : "bouts"}`}
              aria-expanded={railOpen}
              aria-controls="fight-card"
            >
              <MenuIcon />
              <span className="card-toggle__label">Fight card</span>
              <span className="card-toggle__count">
                {String(chats.length).padStart(2, "0")}
              </span>
            </button>

            <div className="marquee__masthead">
              <span className={`marquee__live${loading ? " is-live" : ""}`}>
                {loading ? (
                  <>
                    <span className="live-dot" aria-hidden="true" />
                    Battle in progress
                  </>
                ) : (
                  "Model vs model"
                )}
              </span>
              <h1 className="wordmark">
                Model <span className="wordmark__hollow">Arena</span>
              </h1>
            </div>
          </div>

          <div className="marquee__extras">
            <p className="matchup">
              <span className="matchup__dot matchup__dot--red" aria-hidden="true" />
              Cohere
              <span className="matchup__x" aria-hidden="true">
                ×
              </span>
              Groq
              <span className="matchup__dot matchup__dot--blue" aria-hidden="true" />
            </p>
            <p className="marquee__kicker">Official judges' scorecard</p>
          </div>
        </header>

        <div className="stage__scroll" ref={scrollRef}>
          <div className="stage__inner">
            {loading ? (
              <LiveBout problem={pendingProblem} />
            ) : activeChat ? (
              <BattleView
                chat={activeChat}
                boutNumber={formatBoutNumber(activeIndex)}
                isFresh={activeChat.id === freshBattleId}
              />
            ) : (
              <EmptyState chatCount={chats.length} onPickPrompt={pickPrompt} />
            )}
          </div>
        </div>

        <Composer
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSend}
          loading={loading}
          error={error}
          onDismissError={() => setError(null)}
          inputRef={textareaRef}
        />
      </main>
    </div>
  )
}

const ChatPage = () => {
  const [sharedReport, setSharedReport] = useState(readSharedReport)

  useEffect(() => {
    const handleHashChange = () => setSharedReport(readSharedReport())

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const exitSharedReport = () => {
    clearShareHash()
    setSharedReport({ status: "none" })
  }

  if (sharedReport.status !== "none") {
    return <SharedReportPage report={sharedReport} onExit={exitSharedReport} />
  }

  return <ArenaPage />
}

export { ChatPage }
