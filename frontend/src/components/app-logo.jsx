import { Link } from 'react-router-dom'

export function AppLogo({ to = '/' }) {
  return (
    <Link className="brand-mark" to={to}>
      <span className="brand-mark__badge">CS</span>
      <span>
        <strong>CalStudio</strong>
        <small>Scheduling MVP</small>
      </span>
    </Link>
  )
}
