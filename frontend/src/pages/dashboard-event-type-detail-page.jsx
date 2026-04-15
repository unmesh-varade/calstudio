import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/button-link'
import { QueryState } from '../components/query-state'
import { EventTypeForm } from '../features/event-types/event-type-form'
import { api } from '../lib/api'

export function DashboardEventTypeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eventTypesQuery = useQuery({
    queryKey: ['event-types'],
    queryFn: api.listEventTypes,
  })

  const eventType = eventTypesQuery.data?.find((item) => String(item.id) === id)

  const updateMutation = useMutation({
    mutationFn: (payload) => api.updateEventType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] })
      navigate('/dashboard/event-types')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEventType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] })
      navigate('/dashboard/event-types')
    },
  })

  function handleDelete() {
    if (!eventType) {
      return
    }

    const confirmed = window.confirm(
      `Delete "${eventType.title}"? This only works when no bookings exist for the event type.`,
    )

    if (confirmed) {
      deleteMutation.mutate()
    }
  }

  const mutationError = updateMutation.error?.message || deleteMutation.error?.message

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Event type detail</p>
          <h2>{eventType?.title || 'Loading event type'}</h2>
          <p>Update the shareable slug, duration, and booking status from one form.</p>
        </div>
        <ButtonLink to="/dashboard/event-types" variant="ghost">
          Back to list
        </ButtonLink>
      </div>

      <QueryState
        isLoading={eventTypesQuery.isLoading}
        error={eventTypesQuery.error}
        empty={!eventType && 'Event type not found.'}
      >
        <div className="detail-card">
          <div className="detail-row">
            <span>Public URL</span>
            <strong>/{eventType?.organizerUsername || 'codemorty'}/{eventType?.slug}</strong>
          </div>
          <div className="detail-row">
            <span>Bookings</span>
            <strong>{eventType?.bookingCount}</strong>
          </div>
          <div className="detail-row">
            <span>Timezone</span>
            <strong>{eventType?.schedule?.timezone}</strong>
          </div>
        </div>

        {eventType ? (
          <EventTypeForm
            deleteDisabled={eventType.bookingCount > 0}
            error={mutationError}
            initialValues={eventType}
            isDeleting={deleteMutation.isPending}
            isSubmitting={updateMutation.isPending}
            onDelete={handleDelete}
            onSubmit={(values) => updateMutation.mutate(values)}
            submitLabel="Save changes"
          />
        ) : null}
      </QueryState>
    </section>
  )
}
