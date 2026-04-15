import { CalendarCheck2, Clock3, Link2, ShieldCheck } from 'lucide-react'
import { ButtonLink } from '../components/button-link'

const highlights = [
  {
    title: 'Event type management',
    description: 'Create, edit, and share focused meeting types with clean public slugs.',
    icon: Link2,
  },
  {
    title: 'Timezone-aware availability',
    description: 'Weekly rules stay anchored to the admin timezone while bookings save in UTC.',
    icon: Clock3,
  },
  {
    title: 'Reliable booking logic',
    description: 'Slots respect working hours and reject conflicts across every event type.',
    icon: ShieldCheck,
  },
  {
    title: 'Simple interview-ready flows',
    description: 'One dashboard, one public booking page, and a clear end-to-end booking path.',
    icon: CalendarCheck2,
  },
]

export function HomePage() {
  return (
    <div className="marketing-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Cal.com-inspired scheduling platform</p>
          <h1>Scheduling that feels polished, explainable, and ready to demo.</h1>
          <p className="hero-body">
            This MVP lets one default admin define availability, publish booking links, accept
            guests, and manage bookings from a crisp dashboard.
          </p>
          <div className="hero-actions">
            <ButtonLink to="/dashboard/event-types">Go to dashboard</ButtonLink>
            <ButtonLink to="/codemorty" variant="ghost">
              Try sample booking flow
            </ButtonLink>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-card">
            <strong>Deterministic slot generation</strong>
            <p>
              Slots are computed from weekly availability rules, filtered against existing bookings,
              and stored in UTC to ensure consistent cross-timezone scheduling.
            </p>
          </div>

          <div className="preview-grid">
            <div className="preview-metric">
              <span>Weekly</span>
              <small>Availability rules</small>
            </div>
            <div className="preview-metric">
              <span>UTC</span>
              <small>Time storage standard</small>
            </div>
            <div className="preview-metric">
              <span>Strict</span>
              <small>No overlapping bookings</small>
            </div>
            <div className="preview-metric">
              <span>Single</span>
              <small>Admin workflow</small>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {highlights.map((item) => {
          const Icon = item.icon

          return (
            <article className="feature-card" key={item.title}>
              <div className="feature-icon">
                <Icon size={18} />
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          )
        })}
      </section>
    </div>
  )
}