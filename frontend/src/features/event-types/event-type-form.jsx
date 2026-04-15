import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const defaultQuestion = {
  id: undefined,
  label: '',
  type: 'shortText',
  placeholder: '',
  isRequired: false,
}

const defaultValues = {
  title: '',
  slug: '',
  description: '',
  durationMinutes: '30',
  bufferMinutes: '0',
  isActive: true,
  questions: [],
}

function normalizeQuestions(questions = []) {
  return questions.map((question) => ({
    ...defaultQuestion,
    ...question,
    placeholder: question?.placeholder || '',
    isRequired: Boolean(question?.isRequired),
    type: question?.type || 'shortText',
  }))
}

export function EventTypeForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onDelete,
  isDeleting = false,
  deleteDisabled = false,
}) {
  const [values, setValues] = useState(() => ({
    ...defaultValues,
    ...initialValues,
    durationMinutes: String(initialValues?.durationMinutes ?? defaultValues.durationMinutes),
    bufferMinutes: String(initialValues?.bufferMinutes ?? defaultValues.bufferMinutes),
    questions: normalizeQuestions(initialValues?.questions),
  }))

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
      durationMinutes: String(initialValues?.durationMinutes ?? defaultValues.durationMinutes),
      bufferMinutes: String(initialValues?.bufferMinutes ?? defaultValues.bufferMinutes),
      questions: normalizeQuestions(initialValues?.questions),
    })
  }, [initialValues])

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateQuestion(index, field, value) {
    setValues((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              [field]: value,
            }
          : question,
      ),
    }))
  }

  function addQuestion() {
    setValues((current) => ({
      ...current,
      questions: [...current.questions, { ...defaultQuestion }],
    }))
  }

  function removeQuestion(index) {
    setValues((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      title: values.title.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      durationMinutes: Number(values.durationMinutes),
      bufferMinutes: Number(values.bufferMinutes),
      isActive: values.isActive,
      questions: values.questions.map((question) => ({
        id: question.id,
        label: question.label.trim(),
        type: question.type,
        placeholder: question.placeholder.trim(),
        isRequired: question.isRequired,
      })),
    })
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Title</span>
          <input
            className="field__control"
            maxLength={120}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Intro Call"
            required
            type="text"
            value={values.title}
          />
        </label>

        <label className="field">
          <span className="field__label">Slug</span>
          <input
            className="field__control"
            maxLength={120}
            onChange={(event) => updateField('slug', event.target.value.toLowerCase())}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="intro-call"
            required
            type="text"
            value={values.slug}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Description</span>
        <textarea
          className="field__control field__control--textarea"
          maxLength={500}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="A quick intro call to understand goals and next steps."
          required
          rows={5}
          value={values.description}
        />
      </label>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Duration in minutes</span>
          <input
            className="field__control"
            max="480"
            min="1"
            onChange={(event) => updateField('durationMinutes', event.target.value)}
            required
            type="number"
            value={values.durationMinutes}
          />
        </label>

        <label className="field">
          <span className="field__label">Buffer after meeting</span>
          <input
            className="field__control"
            max="240"
            min="0"
            onChange={(event) => updateField('bufferMinutes', event.target.value)}
            required
            type="number"
            value={values.bufferMinutes}
          />
        </label>
      </div>

      <section className="question-editor">
        <div className="section-heading">
          <div>
            <span className="field__label">Custom booking questions</span>
            <p className="section-heading__copy">
              Ask for context before the meeting without changing the rest of the booking flow.
            </p>
          </div>
          <button className="button button--ghost" onClick={addQuestion} type="button">
            <Plus size={16} />
            Add question
          </button>
        </div>

        {values.questions.length ? (
          <div className="question-editor__list">
            {values.questions.map((question, index) => (
              <article className="question-card" key={question.id || `new-${index}`}>
                <div className="question-card__header">
                  <strong>Question {index + 1}</strong>
                  <button
                    className="button button--ghost button--danger"
                    onClick={() => removeQuestion(index)}
                    type="button"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span className="field__label">Prompt</span>
                    <input
                      className="field__control"
                      maxLength={160}
                      onChange={(event) => updateQuestion(index, 'label', event.target.value)}
                      placeholder="What would you like to focus on?"
                      required
                      type="text"
                      value={question.label}
                    />
                  </label>

                  <label className="field">
                    <span className="field__label">Answer style</span>
                    <select
                      className="field__control"
                      onChange={(event) => updateQuestion(index, 'type', event.target.value)}
                      value={question.type}
                    >
                      <option value="shortText">Short answer</option>
                      <option value="longText">Long answer</option>
                    </select>
                  </label>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span className="field__label">Placeholder</span>
                    <input
                      className="field__control"
                      maxLength={280}
                      onChange={(event) => updateQuestion(index, 'placeholder', event.target.value)}
                      placeholder="Please share anything that will help prepare for our meeting."
                      type="text"
                      value={question.placeholder}
                    />
                  </label>

                  <label className="toggle-field">
                    <input
                      checked={question.isRequired}
                      onChange={(event) => updateQuestion(index, 'isRequired', event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      <strong>Required question</strong>
                      <small>Guests must answer this before confirming the booking.</small>
                    </span>
                  </label>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state question-editor__empty">
            Add optional prompts like meeting goals, project links, or prep notes.
          </div>
        )}
      </section>

      <div className="form-grid">
        <label className="toggle-field">
          <input
            checked={values.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Accept bookings</strong>
            <small>Inactive links stay in the dashboard but disappear publicly.</small>
          </span>
        </label>
      </div>

      {error ? <div className="form-message form-message--error">{error}</div> : null}

      <div className="form-actions">
        <button className="button button--primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>

        {onDelete ? (
          <div className="delete-group">
            <button
              className="button button--ghost button--danger"
              disabled={deleteDisabled || isDeleting}
              onClick={onDelete}
              type="button"
            >
              {isDeleting ? 'Deleting...' : 'Delete event type'}
            </button>
            {deleteDisabled ? (
              <small className="form-hint">
                This event type already has bookings, so the backend will not allow deletion.
              </small>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  )
}
