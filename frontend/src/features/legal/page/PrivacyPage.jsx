import { LegalShell } from "../components/LegalShell.jsx"

const PrivacyPage = () => (
  <LegalShell
    title="Privacy"
    kicker="What happens to your prompts"
    path="/privacy"
    summary="Model Arena is a small beta demo, not an account-based product. This page explains what a prompt touches, what stays in your browser, and which services handle data."
  >
    <section className="legal-section" aria-labelledby="privacy-handling">
      <h2 id="privacy-handling">What you send and who handles it</h2>
      <p>
        Your prompt goes from the browser to the Model Arena API on Render. The API sends it to
        Cohere and to Groq, and each provider writes one answer. Groq also runs the judge, which
        reads the prompt, both answers, and returns scores and written reasoning. The result comes
        back to your browser.
      </p>
      <p>
        Model and hosting providers process data under their own terms and privacy policies. Only
        send prompts you are comfortable passing to these services.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-server">
      <h2 id="privacy-server">What is stored on the server</h2>
      <p>
        There is no database and there are no user accounts. The API does not keep a server-side
        history of prompts, answers, or reports.
      </p>
      <p>Two things live in the API process memory while it runs:</p>
      <ul>
        <li>
          A response cache of up to 100 entries for 30 minutes, keyed by the trimmed prompt, so a
          repeated prompt can avoid another model call.
        </li>
        <li>
          Per-IP rate-limit counters for 6 requests per minute and 40 requests per hour.
        </li>
      </ul>
      <p>
        Both are process-local. They are cleared when the API restarts or redeploys and are not
        shared between instances.
      </p>
      <p>
        Render and Vercel may keep standard infrastructure logs, such as IP address, user agent,
        timestamp, and request path, under their own policies. Model Arena does not use those logs
        to build user profiles.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-browser">
      <h2 id="privacy-browser">What is stored in your browser</h2>
      <p>
        Battle history is saved in localStorage under the key{" "}
        <code>ai-battle-arena:fight-card:v1</code>. It contains the prompt, both answers, scores,
        judge feedback, winner, date, and the last active bout. The app reads it on load to restore
        the fight card.
      </p>
      <p>
        Shared reports are compressed into the URL after <code>#b=</code>. That data is not sent to
        the API, but it is part of the link and may be kept in browser history. Anyone with the link
        can read it.
      </p>
      <p>
        Browser storage stays until you clear site data. The app does not expire it and cannot
        remove it from your device for you.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-cookies">
      <h2 id="privacy-cookies">Cookies and analytics</h2>
      <p>The app does not set cookies of its own.</p>
      <p>
        It loads Vercel Web Analytics to count page views in aggregate. Vercel's analytics script is
        designed to work without cookies, and Vercel processes that data under its own privacy
        policy. The app adds no advertising trackers and no cross-site profiles.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-processors">
      <h2 id="privacy-processors">Third-party processors</h2>
      <ul>
        <li>Vercel: serves the web app and runs Web Analytics.</li>
        <li>Render: hosts the API.</li>
        <li>Cohere: generates one answer for the red corner.</li>
        <li>Groq: generates one answer for the blue corner and runs the judge.</li>
        <li>Google Fonts: serves the Anton, DM Mono, and Public Sans font files.</li>
      </ul>
      <p>
        Prompts and answers reach Cohere and Groq as described above. Vercel and Google Fonts
        receive normal web request data, not your prompt.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-retention">
      <h2 id="privacy-retention">Retention</h2>
      <ul>
        <li>localStorage: until you clear it in your browser.</li>
        <li>Response cache: up to 30 minutes.</li>
        <li>Rate-limit counters: until the API process restarts.</li>
        <li>Server-side report archive: none. There is no database.</li>
        <li>Provider logs: kept by each provider under its own policy.</li>
      </ul>
    </section>

    <section className="legal-section" aria-labelledby="privacy-choices">
      <h2 id="privacy-choices">Your choices</h2>
      <ul>
        <li>Clear site data in your browser to remove battle history.</li>
        <li>Use a private window if you do not want battles kept after it closes.</li>
        <li>Avoid sending secrets, personal data, or confidential material.</li>
        <li>Treat a share link as public to anyone who receives it.</li>
      </ul>
      <p>
        You can use Model Arena without creating an account. There is nothing to delete
        server-side because no account or database record exists.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="privacy-contact">
      <h2 id="privacy-contact">Contact</h2>
      <p>
        Questions about this page: <a href="mailto:furqank219@gmail.com">furqank219@gmail.com</a>.
      </p>
    </section>
  </LegalShell>
)

export { PrivacyPage }
