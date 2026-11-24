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
          <dt>Fighter A wins</dt>
          <dd>{record.firstWins}</dd>
        </div>
        <div className="record__cell record__cell--blue">
          <dt>Fighter B wins</dt>
          <dd>{record.secondWins}</dd>
        </div>
        <div className="record__cell">
          <dt>Avg fighter A</dt>
          <dd>{formatAverage(record.firstAverage)}</dd>
        </div>
        <div className="record__cell">
          <dt>Avg fighter B</dt>
          <dd>{formatAverage(record.secondAverage)}</dd>
        </div>
      </dl>
    </section>
  )
}

export { RecordStrip }
