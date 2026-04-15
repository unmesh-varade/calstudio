import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/utils'

const views = ['upcoming', 'past', 'cancelled']

export function DashboardBookingsPage() {
  const [view, setView] = useState('upcoming')
  const [pendingCancelId, setPendingCancelId] = useState(null)
  const queryClient = useQueryClient()

  const bookingsQuery = useQuery({
    queryKey: ['bookings', view],
    queryFn: () => api.listBookings(view),
  })

  const cancelMutation = useMutation({
    mutationFn: api.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setPendingCancelId(null)
    },
    onError: () => {
      setPendingCancelId(null)
    },
  })

  const emptyText = useMemo(() => {
    if (view === 'past') {
      return 'No past bookings yet.'
    }

    if (view === 'cancelled') {
      return 'No cancelled bookings yet.'
    }

    return 'No upcoming bookings yet.'
  }, [view])

  function handleCancel(booking) {
    const confirmed = window.confirm(
      `Cancel the ${booking.eventType.title} booking for ${booking.attendeeName}?`,
    )

    if (confirmed) {
      setPendingCancelId(booking.id)
      cancelMutation.mutate(booking.id)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Booking timeline</p>
          <h2>Bookings</h2>
          <p>Review scheduled meetings, move through history, and cancel future bookings.</p>
        </div>
        <div className="segmented-control">
          {views.map((item) => (
            <button
              className={item === view ? 'segment segment--active' : 'segment'}
              key={item}
              onClick={() => setView(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {cancelMutation.error ? (
        <div className="form-message form-message--error">{cancelMutation.error.message}</div>
      ) : null}

      <QueryState
        isLoading={bookingsQuery.isLoading}
        error={bookingsQuery.error}
        empty={!bookingsQuery.data?.length && emptyText}
      >
        <div className="booking-list">
          {bookingsQuery.data?.map((booking) => (
            <article className="list-card booking-card booking-card--split" key={booking.id}>
              <div className="booking-card__main">
                <div className="booking-card__header">
                  <div className="booking-card__identity">
                    <div className="card-title-row booking-card__title-row">
                      <h3>{booking.attendeeName}</h3>
                      <span
                        className={
                          booking.status === 'scheduled'
                            ? 'status-pill status-pill--success'
                            : 'status-pill'
                        }
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p>{booking.attendeeEmail}</p>
                  </div>
                </div>

                <div className="meta-column booking-card__meta">
                  <span>{booking.eventType.title}</span>
                  <span>
                    {formatDateTime(booking.startTimeUtc, booking.eventType.timezone || 'UTC')}
                  </span>
                  <span>{booking.attendeeTimezone || 'Timezone not shared'}</span>
                </div>

                {booking.answers?.length ? (
                  <div className="confirmation-notes booking-card__answers">
                    <h3>Booking answers</h3>
                    <div className="confirmation-notes__list">
                      {booking.answers.map((answer) => (
                        <div className="confirmation-notes__item" key={answer.id}>
                          <span>{answer.questionLabel}</span>
                          <strong>{answer.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="booking-card__footer">
                  <span>Event slug: {booking.eventType.slug}</span>
                  <span>Booking #{booking.id}</span>
                </div>
              </div>

              {view === 'upcoming' ? (
                <div className="booking-card__actions">
                  <button
                    className="button button--ghost button--danger booking-card__action-button"
                    disabled={pendingCancelId === booking.id}
                    onClick={() => handleCancel(booking)}
                    type="button"
                  >
                    {pendingCancelId === booking.id ? 'Updating...' : 'Cancel booking'}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </QueryState>
    </section>
  )
}
