import { useEffect, useState } from 'react'

const defaultValues = {
  title: '',
  slug: '',
  description: '',
  durationMinutes: '30',
  bufferMinutes: '0',
  isActive: true,
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
  }))

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
      durationMinutes: String(initialValues?.durationMinutes ?? defaultValues.durationMinutes),
      bufferMinutes: String(initialValues?.bufferMinutes ?? defaultValues.bufferMinutes),
    })
  }, [initialValues])

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
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
