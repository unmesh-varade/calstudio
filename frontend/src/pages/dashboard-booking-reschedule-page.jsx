import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, Globe2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookingDatePickerPanel } from '../components/booking/booking-date-picker-panel'
import { BookingSlotListPanel } from '../components/booking/booking-slot-list-panel'
import { BookingSummaryPanel } from '../components/booking/booking-summary-panel'
import { BookingTimezoneSelect } from '../components/booking/booking-timezone-select'
import { ButtonLink } from '../components/button-link'
import { QueryState } from '../components/query-state'
import { useBookingDateSelection } from '../hooks/use-booking-date-selection'
import { api } from '../lib/api'
import {
  formatDateTime,
  getCalendarDateInTimeZone,
  getTomorrowCalendarDate,
} from '../lib/utils'

export function DashboardBookingReschedulePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id),
    enabled: Boolean(id),
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
    setReason(bookingQuery.data.rescheduleReason || '')
  }, [bookingQuery.data, syncDate])

  const slotsQuery = useQuery({
    queryKey: ['booking-reschedule-slots', id, selectedDateString, viewerTimezone],
    queryFn: () => api.getBookingRescheduleSlots(id, selectedDateString, viewerTimezone),
    enabled: Boolean(id && selectedDateString && viewerTimezone && bookingQuery.data?.status === 'scheduled'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: (payload) => api.rescheduleBooking(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      navigate('/dashboard/bookings')
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
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Booking update</p>
          <h2>Reschedule booking</h2>
          <p>Pick a new time using the same availability rules guests see on the public booking page.</p>
        </div>
        <ButtonLink to="/dashboard/bookings" variant="ghost">
          Back to bookings
        </ButtonLink>
      </div>

      <QueryState
        isLoading={bookingQuery.isLoading}
        error={bookingQuery.error}
        empty={!bookingQuery.data && 'Booking not found.'}
      >
        {bookingQuery.data ? (
          <section className="booking-shell booking-shell--enhanced">
            <BookingSummaryPanel
              avatar={
                <div className="public-avatar booking-summary__avatar">
                  {bookingQuery.data.attendeeName?.[0]?.toUpperCase() || 'G'}
                </div>
              }
              eyebrow={bookingQuery.data.attendeeEmail}
              meta={
                <>
                  <span>
                    <Clock3 size={15} />
                    {bookingQuery.data.eventType.durationMinutes} minute meeting
                  </span>
                  <span>
                    <Globe2 size={15} />
                    Viewing slots in {viewerTimezone}
                  </span>
                  <span>
                    <UserRound size={15} />
                    Guest: {bookingQuery.data.attendeeName}
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
                    label="Guest timezone"
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
                  <h3>Reschedule details</h3>
                  <p>Send the guest a clear update with the old and new time.</p>
                </div>

                <label className="field">
                  <span className="field__label">Reason for reschedule</span>
                  <textarea
                    className="field__control field__control--textarea"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Let the guest know why this meeting is moving."
                    rows={4}
                    value={reason}
                  />
                </label>

                {rescheduleMutation.error ? (
                  <div className="form-message form-message--error">{rescheduleMutation.error.message}</div>
                ) : null}

                <button className="button button--primary" disabled={!selectedSlot || rescheduleMutation.isPending} type="submit">
                  {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm reschedule'}
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </QueryState>
    </section>
  )
}
