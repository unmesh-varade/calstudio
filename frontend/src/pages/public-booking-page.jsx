import { useMutation, useQuery } from '@tanstack/react-query'
import { addDays, format, startOfToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock3, Globe2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { useNavigate, useParams } from 'react-router-dom'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'
import { timezoneOptions } from '../lib/timezones'
import { formatDateLabel, formatDateTime } from '../lib/utils'

function getInitialDate() {
  return addDays(startOfToday(), 1)
}

const defaultForm = {
  attendeeName: '',
  attendeeEmail: '',
  attendeeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  answers: {},
}

function buildAnswerState(questions = []) {
  return questions.reduce((accumulator, question) => {
    accumulator[question.id] = ''
    return accumulator
  }, {})
}

export function PublicBookingPage() {
  const { username, slug } = useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(getInitialDate)
  const [visibleMonth, setVisibleMonth] = useState(getInitialDate)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formValues, setFormValues] = useState(defaultForm)

  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])

  const eventTypeQuery = useQuery({
    queryKey: ['public-event-type', username, slug],
    queryFn: () => api.getPublicEventType(username, slug),
    enabled: Boolean(username && slug),
  })

  const slotsQuery = useQuery({
    queryKey: ['public-slots', username, slug, selectedDateString],
    queryFn: () => api.getPublicSlots(username, slug, selectedDateString),
    enabled: Boolean(username && slug),
  })

  const bookingMutation = useMutation({
    mutationFn: api.createPublicBooking,
    onSuccess: (booking) => {
      navigate(`/booking/${booking.id}?email=${encodeURIComponent(booking.attendeeEmail)}`)
    },
  })

  useEffect(() => {
    setFormValues((current) => ({
      ...current,
      answers: buildAnswerState(eventTypeQuery.data?.questions),
    }))
  }, [eventTypeQuery.data?.questions])

  const bookingMutationError = bookingMutation.error?.message

  function handleFormSubmit(event) {
    event.preventDefault()

    if (!selectedSlot) {
      return
    }

    bookingMutation.mutate({
      username,
      slug,
      date: selectedDateString,
      time: selectedSlot.time,
      attendeeName: formValues.attendeeName.trim(),
      attendeeEmail: formValues.attendeeEmail.trim(),
      attendeeTimezone: formValues.attendeeTimezone.trim(),
      answers: (eventTypeQuery.data?.questions || []).map((question) => ({
        questionId: question.id,
        value: formValues.answers[question.id]?.trim() || '',
      })),
    })
  }

  function updateAnswer(questionId, value) {
    setFormValues((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: value,
      },
    }))
  }

  return (
    <section className="booking-shell booking-shell--enhanced">
      <QueryState
        isLoading={eventTypeQuery.isLoading}
        error={eventTypeQuery.error}
        empty={!eventTypeQuery.data && 'Event type not found.'}
      >
        <div className="booking-panel booking-panel--summary booking-summary">
          <div className="public-avatar booking-summary__avatar">
            {eventTypeQuery.data?.organizer.username?.[0]?.toUpperCase() || 'C'}
          </div>
          <p className="eyebrow">{eventTypeQuery.data?.organizer.username}</p>
          <h1>{eventTypeQuery.data?.title}</h1>
          <p>{eventTypeQuery.data?.description}</p>
          <div className="booking-summary__meta">
            <span>
              <Clock3 size={15} />
              {eventTypeQuery.data?.durationMinutes} minute meeting
            </span>
            <span>
              <Clock3 size={15} />
              {eventTypeQuery.data?.bufferMinutes || 0} minute buffer
            </span>
            <span>
              <Globe2 size={15} />
              {eventTypeQuery.data?.timezone}
            </span>
            <span>
              <UserRound size={15} />
              Host: {eventTypeQuery.data?.organizer.name}
            </span>
          </div>
          {selectedSlot ? (
            <div className="booking-selection">
              <strong>Selected</strong>
              <span>
                {formatDateTime(selectedSlot.startTimeUtc, eventTypeQuery.data?.timezone || 'UTC')}
              </span>
            </div>
          ) : null}
        </div>
      </QueryState>

      <div className="booking-panel booking-panel--calendar">
        <div className="booking-panel__heading">
          <p className="eyebrow">Choose a date</p>
          <h2>Available days</h2>
        </div>
        <div className="calendar-shell">
          <DayPicker
            className="booking-calendar"
            components={{
              Chevron: ({ orientation, ...props }) =>
                orientation === 'left' ? <ChevronLeft {...props} size={16} /> : <ChevronRight {...props} size={16} />,
            }}
            disabled={{ before: addDays(startOfToday(), 1) }}
            mode="single"
            month={visibleMonth}
            onMonthChange={(month) => {
              setVisibleMonth(month)
              setSelectedSlot(null)
            }}
            onSelect={(date) => {
              if (!date) {
                return
              }

              setSelectedDate(date)
              setVisibleMonth(date)
              setSelectedSlot(null)
            }}
            selected={selectedDate}
            showOutsideDays
            weekStartsOn={0}
          />
        </div>
      </div>

      <div className="booking-panel booking-panel--booking">
        <div className="booking-panel__heading">
          <p className="eyebrow">Choose a time</p>
          <h2>{formatDateLabel(selectedDate, eventTypeQuery.data?.timezone || 'UTC')}</h2>
        </div>

        <QueryState
          isLoading={slotsQuery.isLoading}
          error={slotsQuery.error}
          empty={!slotsQuery.data?.slots?.length && 'No slots available for this date.'}
        >
          <div className="slot-list slot-list--dense">
            {slotsQuery.data?.slots.map((slot) => (
              <button
                className={
                  selectedSlot?.startTimeUtc === slot.startTimeUtc
                    ? 'slot-button slot-button--active'
                    : 'slot-button'
                }
                key={slot.startTimeUtc}
                onClick={() => setSelectedSlot(slot)}
                type="button"
              >
                {slot.label}
              </button>
            ))}
          </div>
        </QueryState>

        {selectedSlot ? (
          <form className="booking-form" onSubmit={handleFormSubmit}>
            <div className="booking-form__header">
              <h3>Enter your details</h3>
              <p>
                You are booking{' '}
                {formatDateTime(selectedSlot.startTimeUtc, eventTypeQuery.data?.timezone || 'UTC')}
              </p>
            </div>

            <label className="field">
              <span className="field__label">Your name</span>
              <input
                className="field__control"
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, attendeeName: event.target.value }))
                }
                required
                type="text"
                value={formValues.attendeeName}
              />
            </label>

            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__control"
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, attendeeEmail: event.target.value }))
                }
                required
                type="email"
                value={formValues.attendeeEmail}
              />
            </label>

            <label className="field">
              <span className="field__label">Your timezone</span>
              <select
                className="field__control"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    attendeeTimezone: event.target.value,
                  }))
                }
                required
                value={formValues.attendeeTimezone}
              >
                {timezoneOptions.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
            </label>

            {eventTypeQuery.data?.questions?.length ? (
              <section className="booking-question-list">
                <div className="section-heading section-heading--compact">
                  <div>
                    <span className="field__label">Additional booking questions</span>
                    <p className="section-heading__copy">
                      Share a little context so the host can prepare before the meeting.
                    </p>
                  </div>
                </div>

                {eventTypeQuery.data.questions.map((question) =>
                  question.type === 'longText' ? (
                    <label className="field" key={question.id}>
                      <span className="field__label">
                        {question.label}
                        {question.isRequired ? ' *' : ''}
                      </span>
                      <textarea
                        className="field__control field__control--textarea"
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        placeholder={question.placeholder || 'Type your answer'}
                        required={question.isRequired}
                        rows={5}
                        value={formValues.answers[question.id] || ''}
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
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        placeholder={question.placeholder || 'Type your answer'}
                        required={question.isRequired}
                        type="text"
                        value={formValues.answers[question.id] || ''}
                      />
                    </label>
                  ),
                )}
              </section>
            ) : null}

            {bookingMutationError ? (
              <div className="form-message form-message--error">{bookingMutationError}</div>
            ) : null}

            <button className="button button--primary" disabled={bookingMutation.isPending} type="submit">
              {bookingMutation.isPending ? 'Scheduling...' : 'Confirm booking'}
            </button>
          </form>
        ) : (
          <div className="empty-state booking-empty">Pick a slot to continue to the booking form.</div>
        )}
      </div>
    </section>
  )
}
