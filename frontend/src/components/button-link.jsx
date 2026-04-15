import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export function ButtonLink({ className, variant = 'primary', ...props }) {
  return <Link className={cn('button', `button--${variant}`, className)} {...props} />
}
