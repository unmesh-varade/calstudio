import { useQuery } from '@tanstack/react-query'
import { Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { QueryState } from '../components/query-state'
import { api } from '../lib/api'

export function PublicProfilePage() {
  const { username } = useParams()
  const profileQuery = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => api.getPublicProfile(username),
    enabled: Boolean(username),
  })

  return (
    <section className="public-profile-shell">
      <QueryState
        isLoading={profileQuery.isLoading}
        error={profileQuery.error}
        empty={!profileQuery.data && 'Public profile not found.'}
      >
        <article className="public-profile-card">
          <div className="public-avatar">{profileQuery.data?.username?.[0]?.toUpperCase() || 'C'}</div>
          <div className="public-profile-copy">
            <h1>{profileQuery.data?.username}</h1>
            <p>{profileQuery.data?.bio}</p>
          </div>
        </article>

        <div className="public-event-list">
          {profileQuery.data?.eventTypes.map((eventType) => (
            <Link
              className="public-event-card"
              key={eventType.id}
              to={`/${profileQuery.data.username}/${eventType.slug}`}
            >
              <div>
                <h2>{eventType.title}</h2>
                <p>{eventType.description}</p>
              </div>
              <span className="public-event-meta">
                <Clock3 size={14} />
                {eventType.durationMinutes}m
              </span>
            </Link>
          ))}
        </div>
      </QueryState>
    </section>
  )
}
