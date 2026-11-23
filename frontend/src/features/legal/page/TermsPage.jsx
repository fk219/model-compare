import { LegalShell } from "../components/LegalShell.jsx"

const TermsPage = () => (
  <LegalShell
    title="Terms"
    kicker="The short version"
    path="/terms"
    summary="Model Arena is a beta demo for comparing two model answers on one prompt. These terms are short on purpose. By using the app, you agree to them."
  >
    <section className="legal-section" aria-labelledby="terms-beta">
      <h2 id="terms-beta">Beta service</h2>
      <p>
        Model Arena is provided for evaluation and demonstration. It can change, break, pause, or
        shut down at any time. There is no service level agreement, and it should not be the only
        way you reach a model or make a production decision.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-use">
      <h2 id="terms-use">Acceptable use</h2>
      <p>Do not use Model Arena to:</p>
      <ul>
        <li>break the law, threaten or harass people, or distribute malware;</li>
        <li>infringe someone else's rights or bypass another service's protections;</li>
        <li>evade rate limits, overload the API, or disrupt the app for other people;</li>
        <li>submit secrets, personal data, or material you are not allowed to share.</li>
      </ul>
      <p>Access may be blocked if the app is used to abuse the service.</p>
    </section>

    <section className="legal-section" aria-labelledby="terms-quotas">
      <h2 id="terms-quotas">API quotas and fair use</h2>
      <p>
        The public API allows 6 requests per minute and 40 requests per hour per IP, with prompts
        capped at 2,000 characters and a 60-second upstream timeout. Limits can change to protect
        the service and its model budgets.
      </p>
      <p>
        Do not run automated scripts against the public API or resell the service as your own
        without permission. If you need a higher limit, ask first.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-warranty">
      <h2 id="terms-warranty">No warranty</h2>
      <p>
        Answers, scores, and judge reasoning are model output. They can be wrong, incomplete, or
        biased. The app is provided as is, without warranties of any kind, including accuracy,
        availability, and fitness for a particular purpose. Verify anything important with your own
        sources.
      </p>
      <p>
        Cohere and Groq are third-party services. Their availability and terms are outside this
        project's control.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-content">
      <h2 id="terms-content">Content</h2>
      <p>
        You keep the rights you have in the prompts you write. Model output is also subject to the
        terms of the provider that generated it. Model Arena claims no ownership of your prompts or
        answers and keeps no server-side archive.
      </p>
      <p>
        A shared report is readable by anyone with the link. Do not share material you want to keep
        private. The app name, wordmark, and interface belong to the project owner; do not present
        the app as your own.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-termination">
      <h2 id="terms-termination">Termination</h2>
      <p>
        Access can be suspended or blocked at any time, especially for abuse or attempts to avoid
        the limits above. You can stop using the app at any time and clear its local browser data.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-changes">
      <h2 id="terms-changes">Changes to these terms</h2>
      <p>
        These terms may be updated as the app changes. The date at the top of the page will move
        when they do. Continuing to use Model Arena after a change means you accept the updated
        terms.
      </p>
    </section>

    <section className="legal-section" aria-labelledby="terms-contact">
      <h2 id="terms-contact">Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:furqank219@gmail.com">furqank219@gmail.com</a>.
      </p>
    </section>
  </LegalShell>
)

export { TermsPage }
