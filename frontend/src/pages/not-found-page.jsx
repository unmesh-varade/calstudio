import { BackButton } from '../components/back-button'
import { ButtonLink } from '../components/button-link'

export function NotFoundPage() {
  return (
    <section className="page-stack">
      <BackButton />

      <div className="center-panel">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The route exists outside the current scheduling app map.</p>
        <ButtonLink to="/">Return home</ButtonLink>
      </div>
    </section>
  )
}
