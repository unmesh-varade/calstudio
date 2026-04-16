export function buildAnswerState(questions = []) {
  return questions.reduce((accumulator, question) => {
    accumulator[question.id] = ''
    return accumulator
  }, {})
}

export function BookingQuestionFields({
  questions,
  answers,
  onChange,
}) {
  if (!questions?.length) {
    return null
  }

  return (
    <section className="booking-question-list">
      <div className="section-heading section-heading--compact">
        <div>
          <span className="field__label">Additional booking questions</span>
          <p className="section-heading__copy">
            Share a little context so the host can prepare before the meeting.
          </p>
        </div>
      </div>

      {questions.map((question) =>
        question.type === 'longText' ? (
          <label className="field" key={question.id}>
            <span className="field__label">
              {question.label}
              {question.isRequired ? ' *' : ''}
            </span>
            <textarea
              className="field__control field__control--textarea"
              onChange={(event) => onChange(question.id, event.target.value)}
              placeholder={question.placeholder || 'Type your answer'}
              required={question.isRequired}
              rows={5}
              value={answers[question.id] || ''}
            />
          </label>
        ) : (
          <label className="field" key={question.id}>
            <span className="field__label">
              {question.label}
              {question.isRequired ? ' *' : ''}
            </span>
            <input
              className="field__control"
              onChange={(event) => onChange(question.id, event.target.value)}
              placeholder={question.placeholder || 'Type your answer'}
              required={question.isRequired}
              type="text"
              value={answers[question.id] || ''}
            />
          </label>
        ),
      )}
    </section>
  )
}
