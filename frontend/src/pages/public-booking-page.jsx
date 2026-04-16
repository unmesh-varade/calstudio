import { useMutation, useQuery } from '@tanstack/react-query'
import { Clock3, Globe2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/back-button'
import { BookingDatePickerPanel } from '../components/booking/booking-date-picker-panel'
import { BookingQuestionFields, buildAnswerState } from '../components/booking/booking-question-fields'
import { BookingSlotListPanel } from '../components/booking/booking-slot-list-panel'
import { BookingSummaryPanel } from '../components/booking/booking-summary-panel'
import { BookingTimezoneSelect } from '../components/booking/booking-timezone-select'
import { QueryState } from '../components/query-state'
import { useBookingDateSelection } from '../hooks/use-booking-date-selection'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/utils'

const defaultForm = {
  attendeeName: '',
  attendeeEmail: '',
  attendeeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  answers: {},
}

export function PublicBookingPage() {
  const { username, slug } = useParams()
  const navigate = useNavigate()
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formValues, setFormValues] = useState(defaultForm)
  const {
    selectedDate,
    selectedDateString,
    visibleMonth,
    handleMonthChange,
    handleDateSelect,
  } = useBookingDateSelection()

  const eventTypeQuery = useQuery({
    queryKey: ['public-event-type', username, slug],
    queryFn: () => api.getPublicEventType(username, slug),
    enabled: Boolean(username && slug),
  })

  const slotsQuery = useQuery({
    queryKey: ['public-slots', username, slug, selectedDateString, formValues.attendeeTimezone],
    queryFn: () => api.getPublicSlots(username, slug, selectedDateString, formValues.attendeeTimezone),
    enabled: Boolean(username && slug && selectedDateString && formValues.attendeeTimezone),
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
      date: selectedSlot.eventDate,
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

  function updateTimezone(nextTimezone) {
    setSelectedSlot(null)
    setFormValues((current) => ({
      ...current,
      attendeeTimezone: nextTimezone,
    }))
  }

  return (
    <section className="page-stack">
      <BackButton fallbackTo={`/${username || ''}`} />

      <div className="booking-shell booking-shell--enhanced">
        <QueryState
          isLoading={eventTypeQuery.isLoading}
          error={eventTypeQuery.error}
          empty={!eventTypeQuery.data && 'Event type not found.'}
        >
          <BookingSummaryPanel
            avatar={
              <div className="public-avatar booking-summary__avatar">
                {eventTypeQuery.data?.organizer.username?.[0]?.toUpperCase() || 'C'}
              </div>
            }
            description={eventTypeQuery.data?.description}
            eyebrow={eventTypeQuery.data?.organizer.username}
            meta={
              <>
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
              </>
            }
            selection={
              selectedSlot ? (
                <>
                  <strong>Selected</strong>
                  <span>
                    {formatDateTime(selectedSlot.startTimeUtc, formValues.attendeeTimezone || 'UTC')}
                  </span>
                </>
              ) : null
            }
            title={eventTypeQuery.data?.title}
          />
        </QueryState>

        <BookingDatePickerPanel
          onDateSelect={(date) => handleDateSelect(date, () => setSelectedSlot(null))}
          onMonthChange={(month) => handleMonthChange(month, () => setSelectedSlot(null))}
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
        />

        <div className="booking-panel booking-panel--booking">
          <BookingSlotListPanel
            emptyMessage="No slots available for this date."
            headingDate={selectedDateString}
            onSelectSlot={setSelectedSlot}
            selectedSlot={selectedSlot}
            slots={slotsQuery.data?.slots}
            slotsQuery={slotsQuery}
            timezoneField={
              <BookingTimezoneSelect
                label="View slots in your timezone"
                onChange={(event) => updateTimezone(event.target.value)}
                value={formValues.attendeeTimezone}
              />
            }
            timezoneLabel={`Times shown in ${formValues.attendeeTimezone || eventTypeQuery.data?.timezone || 'UTC'}`}
          />

          {selectedSlot ? (
            <form className="booking-form" onSubmit={handleFormSubmit}>
              <div className="booking-form__header">
                <h3>Enter your details</h3>
                <p>
                  You are booking{' '}
                  {formatDateTime(selectedSlot.startTimeUtc, formValues.attendeeTimezone || 'UTC')}
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

              <BookingTimezoneSelect
                label="Your timezone"
                onChange={(event) => updateTimezone(event.target.value)}
                value={formValues.attendeeTimezone}
              />

              <BookingQuestionFields
                answers={formValues.answers}
                onChange={updateAnswer}
                questions={eventTypeQuery.data?.questions || []}
              />

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
      </div>
    </section>
  )
}
