import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BackButton } from '../components/back-button'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/utils'

export function PublicBookingCancelPage() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const bookingQuery = useQuery({
    queryKey: ['public-manage-booking', bookingId, token],
    queryFn: () => api.getPublicManageBooking(bookingId, token),
    enabled: Boolean(bookingId && token),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelPublicBooking(bookingId, token),
    onSuccess: (booking) => {
      navigate(`/booking/${booking.id}?email=${encodeURIComponent(booking.attendeeEmail)}`)
    },
  })

  return (
    <section className="confirmation-shell">
      <BackButton fallbackTo={`/booking/${bookingId}?email=${encodeURIComponent(bookingQuery.data?.attendeeEmail || '')}`} />

      <QueryState
        isLoading={bookingQuery.isLoading}
        error={bookingQuery.error}
        empty={(!token && 'Cancel link is missing its booking token.') || (!bookingQuery.data && 'Booking not found.')}
      >
        {bookingQuery.data ? (
          <article className="confirmation-card confirmation-card--danger">
            <div className="confirmation-icon confirmation-icon--warning">
              <AlertTriangle size={28} />
            </div>
            <h1>Cancel this meeting?</h1>
            <p>
              This will mark the booking as cancelled and email both you and {bookingQuery.data.eventType.organizer.name}.
            </p>

            <div className="confirmation-highlight confirmation-highlight--warning">
              <span>{formatDateTime(bookingQuery.data.startTimeUtc, bookingQuery.data.attendeeTimezone || bookingQuery.data.eventType.timezone || 'UTC')}</span>
              <span>{bookingQuery.data.eventType.title}</span>
            </div>

            {cancelMutation.error ? (
              <div className="form-message form-message--error">{cancelMutation.error.message}</div>
            ) : null}

            <div className="confirmation-actions">
              <Link className="button button--ghost" to={`/booking/${bookingQuery.data.id}?email=${encodeURIComponent(bookingQuery.data.attendeeEmail)}`}>
                Back
              </Link>
              <button className="button button--ghost button--danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()} type="button">
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </article>
        ) : null}
      </QueryState>
    </section>
  )
}
