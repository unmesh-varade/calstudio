import { useCallback, useMemo, useState } from 'react'
import {
  getTomorrowCalendarDate,
  normalizeCalendarDate,
  toCalendarDateString,
} from '../lib/utils'

export function useBookingDateSelection(initialDate = getTomorrowCalendarDate) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [visibleMonth, setVisibleMonth] = useState(initialDate)
  const selectedDateString = useMemo(() => toCalendarDateString(selectedDate), [selectedDate])

  const handleMonthChange = useCallback((month, onResetSelection) => {
    setVisibleMonth(normalizeCalendarDate(month))

    if (onResetSelection) {
      onResetSelection()
    }
  }, [])

  const handleDateSelect = useCallback((date, onResetSelection) => {
    if (!date) {
      return
    }

    const normalizedDate = normalizeCalendarDate(date)

    setSelectedDate(normalizedDate)
    setVisibleMonth(normalizedDate)

    if (onResetSelection) {
      onResetSelection()
    }
  }, [])

  const syncDate = useCallback((nextDate, onResetSelection) => {
    setSelectedDate(nextDate)
    setVisibleMonth(nextDate)

    if (onResetSelection) {
      onResetSelection()
    }
  }, [])

  return {
    selectedDate,
    selectedDateString,
    visibleMonth,
    handleMonthChange,
    handleDateSelect,
    syncDate,
  }
}
