import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toCalendarDateString(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null
  }

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function normalizeCalendarDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null
  }

  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0)
}

export function getTomorrowCalendarDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  return normalizeCalendarDate(date)
}

export function formatDateTime(value, timeZone) {
  if (!value) {
    return 'Time unavailable'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

export function formatDateLabel(value, timeZone) {
  if (!value) {
    return 'Date unavailable'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date)
}

export function formatCalendarDateLabel(value) {
  if (!value) {
    return 'Date unavailable'
  }

  const [year, month, day] = String(value).split('-').map(Number)

  if (!year || !month || !day) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
