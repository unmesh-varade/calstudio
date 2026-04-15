import { Link } from 'react-router-dom'

export function AppLogo({ to = '/' }) {
  return (
    <Link className="brand-mark" to={to}>
      <span className="brand-mark__badge">C</span>
      <span>
        <strong>Cal Studio</strong>
        <small>Scheduling MVP</small>
      </span>
    </Link>
  )
}
