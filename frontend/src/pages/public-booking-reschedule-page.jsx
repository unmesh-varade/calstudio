import { useMutation, useQuery } from '@tanstack/react-query'
import { Clock3, Globe2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookingDatePickerPanel } from '../components/booking/booking-date-picker-panel'
import { BookingSlotListPanel } from '../components/booking/booking-slot-list-panel'
import { BookingSummaryPanel } from '../components/booking/booking-summary-panel'
import { BookingTimezoneSelect } from '../components/booking/booking-timezone-select'
import { QueryState } from '../components/query-state'
import { useBookingDateSelection } from '../hooks/use-booking-date-selection'
import { api } from '../lib/api'
import {
  formatDateTime,
  getCalendarDateInTimeZone,
  getTomorrowCalendarDate,
} from '../lib/utils'

export function PublicBookingReschedulePage() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [viewerTimezone, setViewerTimezone] = useState('UTC')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reason, setReason] = useState('')
  const {
    selectedDate,
    selectedDateString,
    visibleMonth,
    handleMonthChange,
    handleDateSelect,
    syncDate,
  } = useBookingDateSelection()

  const bookingQuery = useQuery({
    queryKey: ['public-manage-booking', bookingId, token],
    queryFn: () => api.getPublicManageBooking(bookingId, token),
    enabled: Boolean(bookingId && token),
  })

  useEffect(() => {
    if (!bookingQuery.data) {
      return
    }

    const nextTimezone = bookingQuery.data.attendeeTimezone || bookingQuery.data.eventType.timezone || 'UTC'
    const nextDate =
      getCalendarDateInTimeZone(bookingQuery.data.startTimeUtc, nextTimezone) || getTomorrowCalendarDate()

    setViewerTimezone(nextTimezone)
    syncDate(nextDate, () => setSelectedSlot(null))
    setReason('')
  }, [bookingQuery.data, syncDate])

  const slotsQuery = useQuery({
    queryKey: ['public-reschedule-slots', bookingId, token, selectedDateString, viewerTimezone],
    queryFn: () => api.getPublicRescheduleSlots(bookingId, token, selectedDateString, viewerTimezone),
    enabled: Boolean(bookingId && token && selectedDateString && viewerTimezone && bookingQuery.data?.status === 'scheduled'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: (payload) => api.reschedulePublicBooking(bookingId, token, payload),
    onSuccess: (booking) => {
      navigate(`/booking/${booking.id}?email=${encodeURIComponent(booking.attendeeEmail)}`)
    },
  })

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedSlot) {
      return
    }

    rescheduleMutation.mutate({
      date: selectedSlot.eventDate,
      time: selectedSlot.time,
      attendeeTimezone: viewerTimezone,
      reason: reason.trim(),
    })
  }

  return (
    <section className="booking-shell booking-shell--enhanced">
      <QueryState
        isLoading={bookingQuery.isLoading}
        error={bookingQuery.error}
        empty={(!token && 'Reschedule link is missing its booking token.') || (!bookingQuery.data && 'Booking not found.')}
      >
        {bookingQuery.data ? (
          <>
            <BookingSummaryPanel
              avatar={
                <div className="public-avatar booking-summary__avatar">
                  {bookingQuery.data.organizerUsername?.[0]?.toUpperCase() || 'C'}
                </div>
              }
              eyebrow={bookingQuery.data.organizerUsername}
              meta={
                <>
                  <span>
                    <Clock3 size={15} />
                    {bookingQuery.data.eventType.durationMinutes} minute meeting
                  </span>
                  <span>
                    <Globe2 size={15} />
                    Viewing in {viewerTimezone}
                  </span>
                  <span>
                    <UserRound size={15} />
                    Hosted by {bookingQuery.data.eventType.organizer.name}
                  </span>
                </>
              }
              stack={
                <>
                  <div className="booking-selection booking-selection--muted">
                    <strong>Current time</strong>
                    <span>{formatDateTime(bookingQuery.data.startTimeUtc, viewerTimezone)}</span>
                  </div>
                  {selectedSlot ? (
                    <div className="booking-selection">
                      <strong>New time</strong>
                      <span>{formatDateTime(selectedSlot.startTimeUtc, viewerTimezone)}</span>
                    </div>
                  ) : null}
                </>
              }
              title={bookingQuery.data.eventType.title}
            />

            <BookingDatePickerPanel
              onDateSelect={(date) => handleDateSelect(date, () => setSelectedSlot(null))}
              onMonthChange={(month) => handleMonthChange(month, () => setSelectedSlot(null))}
              selectedDate={selectedDate}
              visibleMonth={visibleMonth}
            />

            <div className="booking-panel booking-panel--booking">
              <BookingSlotListPanel
                emptyMessage="No alternative slots available for this date."
                excludeStartTimeUtc={bookingQuery.data.startTimeUtc}
                headingDate={selectedDateString}
                onSelectSlot={setSelectedSlot}
                selectedSlot={selectedSlot}
                slots={slotsQuery.data?.slots}
                slotsQuery={slotsQuery}
                timezoneField={
                  <BookingTimezoneSelect
                    label="Your timezone"
                    onChange={(event) => {
                      setSelectedSlot(null)
                      setViewerTimezone(event.target.value)
                    }}
                    value={viewerTimezone}
                  />
                }
                timezoneLabel={`Times shown in ${viewerTimezone}`}
              />

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="booking-form__header">
                  <h3>Reschedule your meeting</h3>
                  <p>Choose a new slot and we will let the organizer know.</p>
                </div>

                <label className="field">
                  <span className="field__label">Your name</span>
                  <input className="field__control" disabled type="text" value={bookingQuery.data.attendeeName} />
                </label>

                <label className="field">
                  <span className="field__label">Email address</span>
                  <input className="field__control" disabled type="email" value={bookingQuery.data.attendeeEmail} />
                </label>

                <label className="field">
                  <span className="field__label">Reason for reschedule</span>
                  <textarea
                    className="field__control field__control--textarea"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Let the organizer know why you need to reschedule."
                    rows={4}
                    value={reason}
                  />
                </label>

                {rescheduleMutation.error ? (
                  <div className="form-message form-message--error">{rescheduleMutation.error.message}</div>
                ) : null}

                <div className="confirmation-actions">
                  <Link className="button button--ghost" to={`/booking/${bookingQuery.data.id}?email=${encodeURIComponent(bookingQuery.data.attendeeEmail)}`}>
                    Back
                  </Link>
                  <button className="button button--primary" disabled={!selectedSlot || rescheduleMutation.isPending} type="submit">
                    {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : null}
      </QueryState>
    </section>
  )
}
