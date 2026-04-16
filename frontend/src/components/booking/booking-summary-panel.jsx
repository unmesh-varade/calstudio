export function BookingSummaryPanel({
  avatar,
  eyebrow,
  title,
  description,
  meta,
  selection,
  stack,
}) {
  return (
    <div className="booking-panel booking-panel--summary booking-summary">
      {avatar}
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {meta ? <div className="booking-summary__meta">{meta}</div> : null}
      {selection ? <div className="booking-selection">{selection}</div> : null}
      {stack ? <div className="booking-summary__stack">{stack}</div> : null}
    </div>
  )
}
