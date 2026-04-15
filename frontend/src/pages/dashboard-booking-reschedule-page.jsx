import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Clock3, Globe2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { useNavigate, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/button-link'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'
import { timezoneOptions } from '../lib/timezones'
import {
  formatCalendarDateLabel,
  formatDateTime,
  getCalendarDateInTimeZone,
  getTomorrowCalendarDate,
  normalizeCalendarDate,
  toCalendarDateString,
} from '../lib/utils'

export function DashboardBookingReschedulePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [viewerTimezone, setViewerTimezone] = useState('UTC')
  const [selectedDate, setSelectedDate] = useState(getTomorrowCalendarDate)
  const [visibleMonth, setVisibleMonth] = useState(getTomorrowCalendarDate)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [reason, setReason] = useState('')

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
    setSelectedDate(nextDate)
    setVisibleMonth(nextDate)
    setSelectedSlot(null)
    setReason(bookingQuery.data.rescheduleReason || '')
  }, [bookingQuery.data])

  const selectedDateString = useMemo(() => toCalendarDateString(selectedDate), [selectedDate])

  const slotsQuery = useQuery({
    queryKey: ['booking-reschedule-slots', id, selectedDateString, viewerTimezone],
    queryFn: () => api.getBookingRescheduleSlots(id, selectedDateString, viewerTimezone),
    enabled: Boolean(id && selectedDateString && viewerTimezone && bookingQuery.data?.status === 'scheduled'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: (payload) => api.rescheduleBooking(id, payload),
    onSuccess: (booking) => {
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
            <div className="booking-panel booking-panel--summary booking-summary">
              <div className="public-avatar booking-summary__avatar">
                {bookingQuery.data.attendeeName?.[0]?.toUpperCase() || 'G'}
              </div>
              <p className="eyebrow">{bookingQuery.data.attendeeEmail}</p>
              <h1>{bookingQuery.data.eventType.title}</h1>
              <div className="booking-summary__meta">
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
              </div>
              <div className="booking-summary__stack">
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
              </div>
            </div>

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
                  disabled={{ before: getTomorrowCalendarDate() }}
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={(month) => {
                    setVisibleMonth(normalizeCalendarDate(month))
                    setSelectedSlot(null)
                  }}
                  onSelect={(date) => {
                    if (!date) {
                      return
                    }

                    const normalizedDate = normalizeCalendarDate(date)
                    setSelectedDate(normalizedDate)
                    setVisibleMonth(normalizedDate)
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
                <h2>{formatCalendarDateLabel(selectedDateString)}</h2>
                <p>Times shown in {viewerTimezone}</p>
              </div>

              <label className="field booking-timezone-field">
                <span className="field__label">Guest timezone</span>
                <select
                  className="field__control"
                  onChange={(event) => {
                    setSelectedSlot(null)
                    setViewerTimezone(event.target.value)
                  }}
                  value={viewerTimezone}
                >
                  {timezoneOptions.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </select>
              </label>

              <QueryState
                isLoading={slotsQuery.isLoading}
                error={slotsQuery.error}
                empty={!slotsQuery.data?.slots?.length && 'No alternative slots available for this date.'}
              >
                <div className="slot-list slot-list--dense">
                  {slotsQuery.data?.slots.map((slot) => (
                    slot.startTimeUtc !== bookingQuery.data.startTimeUtc ? (
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
                    ) : null
                  ))}
                </div>
              </QueryState>

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
