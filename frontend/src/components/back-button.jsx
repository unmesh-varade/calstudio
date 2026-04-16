import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

export function BackButton({ className, fallbackTo = '/', label = 'Back' }) {
  const navigate = useNavigate()

  function handleClick() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallbackTo)
  }

  return (
    <button className={cn('back-button', className)} onClick={handleClick} type="button">
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  )
}
