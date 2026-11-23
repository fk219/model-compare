import { BattleView } from "../components/BattleView.jsx"
import { LegalLinks } from "../../legal/components/LegalLinks.jsx"

const SharedReportPage = ({ report, onExit }) => {
  const isReady = report.status === "ok"

  return (
    <div className="arena arena--report">
      <main className="stage">
        <header className="marquee">
          <div className="marquee__lead">
            <div className="marquee__masthead">
              <span className="report-chip">Shared report</span>
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
            <p className="marquee__kicker">Read-only judges' scorecard</p>
          </div>
        </header>

        <div className="stage__scroll">
          <div className="stage__inner">
            {isReady ? (
              <section className="report-banner" aria-label="Shared battle report">
                <div className="report-banner__body">
                  <p className="report-banner__label">Shared report</p>
                  <p className="report-banner__copy">
                    A bout from someone else's fight card. The link carries both answers, scores, and
                    the judge's reasoning.
                  </p>
                </div>
                <button type="button" className="report-cta" onClick={onExit}>
                  Run your own battle
                </button>
              </section>
            ) : null}

            {isReady ? (
              <>
                <BattleView chat={report.battle} boutNumber="01" isFresh={false} />

                <div className="report-foot">
                  <p className="report-foot__copy">Want a verdict on your own prompts?</p>
                  <button type="button" className="report-cta report-cta--ghost" onClick={onExit}>
                    Run your own battle
                  </button>
                </div>
              </>
            ) : (
              <section className="report-error" role="alert">
                <p className="report-error__kicker">Shared report</p>
                <h2 className="report-error__title">This link won't open.</h2>
                <p className="report-error__copy">{report.message}</p>
                <button type="button" className="report-cta" onClick={onExit}>
                  Run your own battle
                </button>
              </section>
            )}

            <footer className="page-legal">
              <LegalLinks />
            </footer>
          </div>
        </div>
      </main>
    </div>
  )
}

export { SharedReportPage }
