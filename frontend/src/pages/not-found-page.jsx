import { ButtonLink } from '../components/button-link'

export function NotFoundPage() {
  return (
    <section className="center-panel">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The route exists outside the current scheduling app map.</p>
      <ButtonLink to="/">Return home</ButtonLink>
    </section>
  )
}
