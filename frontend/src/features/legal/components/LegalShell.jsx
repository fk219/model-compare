import { useEffect } from "react"
import { LegalLinks } from "./LegalLinks.jsx"

const LegalShell = ({ title, kicker, path, summary, children }) => {
  useEffect(() => {
    const previousTitle = document.title
    const canonical = document.head.querySelector('link[rel="canonical"]')
    const ogUrl = document.head.querySelector('meta[property="og:url"]')
    const previousCanonical = canonical?.getAttribute("href")
    const previousOgUrl = ogUrl?.getAttribute("content")
    const url = `https://ai-battle-arena.furqankhan.dev${path}`

    document.title = `${title}: Model Arena`
    canonical?.setAttribute("href", url)
    ogUrl?.setAttribute("content", url)

    return () => {
      document.title = previousTitle
      if (previousCanonical) canonical?.setAttribute("href", previousCanonical)
      if (previousOgUrl) ogUrl?.setAttribute("content", previousOgUrl)
    }
  }, [title, path])

  return (
    <div className="arena arena--legal">
      <main className="stage">
        <header className="marquee">
          <div className="marquee__lead">
            <div className="marquee__masthead">
              <span className="report-chip">Legal</span>
              <a className="wordmark legal-brand" href="/">
                Model <span className="wordmark__hollow">Arena</span>
              </a>
            </div>
          </div>

          <div className="marquee__extras">
            <p className="matchup">
              <span className="matchup__dot matchup__dot--red" aria-hidden="true" />
              Beta service
              <span className="matchup__dot matchup__dot--blue" aria-hidden="true" />
            </p>
            <p className="marquee__kicker">Plain-language policy</p>
          </div>
        </header>

        <div className="stage__scroll">
          <div className="stage__inner">
            <article className="legal-doc">
              <p className="legal-doc__kicker">{kicker}</p>
              <h1 className="legal-doc__title">{title}</h1>
              <p className="legal-doc__updated">Last updated 24 November 2026</p>
              <p className="legal-doc__intro">{summary}</p>

              {children}

              <footer className="legal-doc__foot">
                <a className="legal-back" href="/">
                  Back to the arena
                </a>
                <LegalLinks />
              </footer>
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}

export { LegalShell }
