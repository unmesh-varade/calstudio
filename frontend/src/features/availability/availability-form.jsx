import { useEffect, useState } from 'react'
import { timezoneOptions } from '../../lib/timezones'

const weekdays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

function buildFormState(initialValues) {
  const rulesByWeekday = new Map((initialValues?.rules || []).map((rule) => [rule.weekday, rule]))

  return {
    name: initialValues?.name || 'Default availability',
    timezone: initialValues?.timezone || 'Asia/Kolkata',
    days: weekdays.map((day) => {
      const existingRule = rulesByWeekday.get(day.value)

      return {
        weekday: day.value,
        label: day.label,
        enabled: Boolean(existingRule),
        startTime: existingRule?.startTime || '09:00',
        endTime: existingRule?.endTime || '17:00',
      }
    }),
  }
}

export function AvailabilityForm({ initialValues, isSubmitting, error, onSubmit }) {
  const [values, setValues] = useState(() => buildFormState(initialValues))

  useEffect(() => {
    setValues(buildFormState(initialValues))
  }, [initialValues])

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateDay(weekday, field, value) {
    setValues((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              [field]: value,
            }
          : day,
      ),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      name: values.name.trim(),
      timezone: values.timezone.trim(),
      rules: values.days
        .filter((day) => day.enabled)
        .map((day) => ({
          weekday: day.weekday,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
    })
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Schedule name</span>
          <input
            className="field__control"
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Default availability"
            required
            type="text"
            value={values.name}
          />
        </label>

        <label className="field">
          <span className="field__label">Timezone</span>
          <select
            className="field__control"
            onChange={(event) => updateField('timezone', event.target.value)}
            required
            value={values.timezone}
          >
            {timezoneOptions.map((timeZone) => (
              <option key={timeZone} value={timeZone}>
                {timeZone}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="availability-days">
        {values.days.map((day) => (
          <div className="availability-day" key={day.weekday}>
            <label className="toggle-field toggle-field--row">
              <input
                checked={day.enabled}
                onChange={(event) => updateDay(day.weekday, 'enabled', event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>{day.label}</strong>
                <small>
                  {day.enabled ? 'Bookings can be offered on this day.' : 'Day disabled.'}
                </small>
              </span>
            </label>

            <div className="availability-time-grid">
              <label className="field">
                <span className="field__label">Start</span>
                <input
                  className="field__control"
                  disabled={!day.enabled}
                  onChange={(event) => updateDay(day.weekday, 'startTime', event.target.value)}
                  type="time"
                  value={day.startTime}
                />
              </label>

              <label className="field">
                <span className="field__label">End</span>
                <input
                  className="field__control"
                  disabled={!day.enabled}
                  onChange={(event) => updateDay(day.weekday, 'endTime', event.target.value)}
                  type="time"
                  value={day.endTime}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {error ? <div className="form-message form-message--error">{error}</div> : null}

      <div className="form-actions">
        <button className="button button--primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : 'Save availability'}
        </button>
      </div>
    </form>
  )
}
