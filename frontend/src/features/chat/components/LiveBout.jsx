const Equalizer = () => (
  <span className="eq" aria-hidden="true">
    {Array.from({ length: 7 }, (_, index) => (
      <i key={index} />
    ))}
  </span>
)

const LiveBout = ({ problem }) => {
  return (
    <section className="live-bout" role="status" aria-live="polite" aria-busy="true">
      <div className="live-bout__top">
        <span className="on-air">
          <span className="live-dot" aria-hidden="true" />
          On air
        </span>
        <span className="live-bout__label">Bout in progress</span>
      </div>

      <h2 className="live-bout__title">Models are battling</h2>

      {problem ? <p className="live-bout__prompt">“{problem}”</p> : null}

      <div className="live-bout__ring">
        <div className="live-corner live-corner--red">
          <span className="live-corner__name">Cohere</span>
          <Equalizer />
          <span className="live-corner__state">Drafting</span>
        </div>

        <span className="live-bout__vs" aria-hidden="true">
          VS
        </span>

        <div className="live-corner live-corner--blue">
          <span className="live-corner__name">Groq</span>
          <Equalizer />
          <span className="live-corner__state">Drafting</span>
        </div>
      </div>

      <p className="live-bout__foot">
        A judge is reading both answers and scoring the bout. This can take a moment.
      </p>
    </section>
  )
}

export { LiveBout }
