import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { getTomorrowCalendarDate } from '../../lib/utils'

export function BookingDatePickerPanel({
  heading = 'Available days',
  eyebrow = 'Choose a date',
  selectedDate,
  visibleMonth,
  onMonthChange,
  onDateSelect,
}) {
  return (
    <div className="booking-panel booking-panel--calendar">
      <div className="booking-panel__heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{heading}</h2>
      </div>
      <div className="calendar-shell">
        <DayPicker
          className="booking-calendar"
          components={{
            Chevron: ({ orientation, ...props }) =>
              orientation === 'left' ? (
                <ChevronLeft {...props} size={16} />
              ) : (
                <ChevronRight {...props} size={16} />
              ),
          }}
          disabled={{ before: getTomorrowCalendarDate() }}
          mode="single"
          month={visibleMonth}
          onMonthChange={onMonthChange}
          onSelect={onDateSelect}
          selected={selectedDate}
          showOutsideDays
          weekStartsOn={0}
        />
      </div>
    </div>
  )
}
