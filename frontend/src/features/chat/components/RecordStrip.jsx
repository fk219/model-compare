import { computeArenaRecord, formatAverage } from "../lib/stats"

const RecordStrip = ({ chats }) => {
  const record = computeArenaRecord(chats)

  return (
    <section className="record" aria-label="Your arena record">
      <p className="record__label">Your record</p>

      <dl className="record__grid">
        <div className="record__cell">
          <dt>Bouts</dt>
          <dd>{record.total}</dd>
        </div>
        <div className="record__cell">
          <dt>Draws</dt>
          <dd>{record.ties}</dd>
        </div>
        <div className="record__cell record__cell--red">
          <dt>Cohere wins</dt>
          <dd>{record.cohereWins}</dd>
        </div>
        <div className="record__cell record__cell--blue">
          <dt>Groq wins</dt>
          <dd>{record.groqWins}</dd>
        </div>
        <div className="record__cell">
          <dt>Avg Cohere</dt>
          <dd>{formatAverage(record.cohereAverage)}</dd>
        </div>
        <div className="record__cell">
          <dt>Avg Groq</dt>
          <dd>{formatAverage(record.groqAverage)}</dd>
        </div>
      </dl>
    </section>
  )
}

export { RecordStrip }
