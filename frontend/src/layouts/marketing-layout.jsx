import { Outlet } from 'react-router-dom'
import { AppLogo } from '../components/app-logo'
import { ButtonLink } from '../components/button-link'

export function MarketingLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <AppLogo />
        <div className="header-actions">
          <ButtonLink to="/codemorty" variant="ghost">
            Public Booking Page
          </ButtonLink>
          <ButtonLink to="/dashboard/event-types">Open dashboard</ButtonLink>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
