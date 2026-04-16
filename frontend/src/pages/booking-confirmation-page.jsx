import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock3, Globe2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BookingAnswerList } from '../components/booking/booking-answer-list'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/utils'

export function BookingConfirmationPage() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  const bookingQuery = useQuery({
    queryKey: ['public-booking-confirmation', bookingId, email],
    queryFn: () => api.getPublicBookingConfirmation(bookingId, email),
    enabled: Boolean(bookingId && email),
  })

  const manageToken = bookingQuery.data?.manageToken
  const isCancelled = bookingQuery.data?.status === 'cancelled'

  return (
    <section className="confirmation-shell">
      <QueryState
        isLoading={bookingQuery.isLoading}
        error={bookingQuery.error}
        empty={
          (!email && 'Booking confirmation link is missing the attendee email.') ||
          (!bookingQuery.isLoading &&
            !bookingQuery.error &&
            !bookingQuery.data &&
            'Booking confirmation not found.')
        }
      >
        <article className="confirmation-card confirmation-card--success">
          <div className="confirmation-icon">
            <CheckCircle2 size={28} />
          </div>
          <h1>{isCancelled ? 'This meeting is cancelled' : 'This meeting is scheduled'}</h1>
          <p>
            {isCancelled
              ? 'The booking is now marked as cancelled and the latest details are shown below.'
              : 'Your booking is confirmed and the saved details are shown below.'}
          </p>

          <div className="confirmation-highlight">
            <span>
              <Clock3 size={15} />
              {formatDateTime(
                bookingQuery.data?.startTimeUtc,
                bookingQuery.data?.eventType.timezone || 'UTC',
              )}
            </span>
            <span>
              <Globe2 size={15} />
              {bookingQuery.data?.attendeeTimezone || bookingQuery.data?.eventType.timezone}
            </span>
          </div>

          <div className="confirmation-grid">
            <span>What</span>
            <strong>
              {bookingQuery.data?.eventType.title} with {bookingQuery.data?.attendeeName}
            </strong>

            <span>Who</span>
            <strong>
              <span className="stack-text">
                <span>{bookingQuery.data?.attendeeName}</span>
                <span>{bookingQuery.data?.attendeeEmail}</span>
              </span>
            </strong>

            <span>Status</span>
            <strong className={isCancelled ? 'status-pill' : 'status-pill status-pill--success'}>
              {bookingQuery.data?.status}
            </strong>

            <span>Event link</span>
            <strong>
              /{bookingQuery.data?.organizerUsername}/{bookingQuery.data?.eventType.slug}
            </strong>
          </div>

          <BookingAnswerList answers={bookingQuery.data?.answers} title="Booking notes" />

          <div className="confirmation-actions">
            <Link className="button button--ghost" to={`/${bookingQuery.data?.organizerUsername || ''}`}>
              Back to public page
            </Link>
            {!isCancelled && manageToken ? (
              <>
                <Link
                  className="button button--ghost"
                  to={`/booking/${bookingQuery.data?.id}/reschedule?token=${encodeURIComponent(manageToken)}`}
                >
                  Reschedule
                </Link>
                <Link
                  className="button button--ghost button--danger"
                  to={`/booking/${bookingQuery.data?.id}/cancel?token=${encodeURIComponent(manageToken)}`}
                >
                  Cancel
                </Link>
              </>
            ) : null}
            <Link
              className="button button--primary"
              to={`/${bookingQuery.data?.organizerUsername || ''}/${bookingQuery.data?.eventType.slug || ''}`}
            >
              Book another time
            </Link>
          </div>
        </article>
      </QueryState>
    </section>
  )
}
