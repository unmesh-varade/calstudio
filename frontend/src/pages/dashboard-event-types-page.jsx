import { useQuery } from '@tanstack/react-query'
import { Link2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/button-link'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'

export function DashboardEventTypesPage() {
  const eventTypesQuery = useQuery({
    queryKey: ['event-types'],
    queryFn: api.listEventTypes,
  })

  return (
    <section className="page-stack">
      <div className="page-heading page-heading--event-types">
        <div>
          <h2>Event types</h2>
          <p>Configure different events for people to book on your calendar.</p>
        </div>
        <div className="toolbar-actions">
          <ButtonLink to="/dashboard/event-types/new" variant="primary">
            <Plus size={16} />
            New
          </ButtonLink>
        </div>
      </div>

      <QueryState
        isLoading={eventTypesQuery.isLoading}
        error={eventTypesQuery.error}
        empty={!eventTypesQuery.data?.length && 'No event types yet.'}
      >
        <div className="event-type-list">
          {eventTypesQuery.data?.map((eventType) => (
            <article className="event-type-row" key={eventType.id}>
              <div className="event-type-row__main">
                <div className="event-type-row__title">
                  <h3>{eventType.title}</h3>
                  <span className="event-type-row__path">
                    /{eventType.organizerUsername || 'codemorty'}/{eventType.slug}
                  </span>
                </div>
                <div className="event-type-row__meta">
                  <span className="event-type-badge">{eventType.durationMinutes}m</span>
                  <span>{eventType.schedule?.timezone}</span>
                  <span>{eventType.bookingCount} bookings</span>
                </div>
              </div>
              <div className="event-type-row__actions">
                <button
                  aria-label={eventType.isActive ? 'Active event type' : 'Inactive event type'}
                  className={
                    eventType.isActive ? 'toggle-indicator toggle-indicator--active' : 'toggle-indicator'
                  }
                  type="button"
                />
                <Link
                  aria-label="Open public event link"
                  className="icon-action"
                  to={`/${eventType.organizerUsername || 'codemorty'}/${eventType.slug}`}
                >
                  <Link2 size={15} />
                </Link>
                <ButtonLink to={`/dashboard/event-types/${eventType.id}`} variant="ghost">
                  View
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
    </section>
  )
}
