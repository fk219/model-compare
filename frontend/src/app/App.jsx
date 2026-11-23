import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"
import "./App.css"
import { ChatPage } from "../features/chat/page/ChatPage.jsx"
import { PrivacyPage } from "../features/legal/page/PrivacyPage.jsx"
import { TermsPage } from "../features/legal/page/TermsPage.jsx"

const getRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, "")

  if (path === "/privacy") return "privacy"
  if (path === "/terms") return "terms"
  return "arena"
}

const App = () => {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return (
    <>
      {route === "privacy" ? <PrivacyPage /> : null}
      {route === "terms" ? <TermsPage /> : null}
      {route === "arena" ? <ChatPage /> : null}
      <Analytics />
    </>
  )
}

export default App
