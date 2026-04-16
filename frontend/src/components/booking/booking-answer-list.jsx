export function BookingAnswerList({ answers, title = 'Booking notes' }) {
  if (!answers?.length) {
    return null
  }

  return (
    <div className="confirmation-notes">
      <h3>{title}</h3>
      <div className="confirmation-notes__list">
        {answers.map((answer) => (
          <div className="confirmation-notes__item" key={answer.id}>
            <span>{answer.questionLabel}</span>
            <strong>{answer.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
