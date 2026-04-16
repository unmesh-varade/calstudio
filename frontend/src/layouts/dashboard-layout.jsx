import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock3, ExternalLink, Layers3 } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { AppLogo } from '../components/app-logo'
import { ButtonLink } from '../components/button-link'
import { api } from '../lib/api'

const navItems = [
  { to: '/dashboard/event-types', label: 'Event types', icon: Layers3 },
  { to: '/dashboard/availability', label: 'Availability', icon: Clock3 },
  { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
]

export function DashboardLayout() {
  const eventTypesQuery = useQuery({
    queryKey: ['event-types'],
    queryFn: api.listEventTypes,
  })

  const publicUsername = eventTypesQuery.data?.[0]?.organizerUsername || 'codemorty'

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <AppLogo />
        <div className="sidebar-copy">
          <p className="eyebrow">Single admin workspace</p>
          <h1>Scheduling dashboard</h1>
          <p>
            Manage event types, weekly hours, and bookings from one clean control panel.
          </p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link'
                }
                to={item.to}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-actions">
          <ButtonLink to={`/${publicUsername}`} variant="ghost">
            <ExternalLink size={16} />
            View public page
          </ButtonLink>
        </div>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
