import { formatCalendarDateLabel } from '../../lib/utils'
import { QueryState } from '../query-state'

export function BookingSlotListPanel({
  headingDate,
  timezoneLabel,
  timezoneField,
  slotsQuery,
  emptyMessage,
  slots,
  selectedSlot,
  onSelectSlot,
  excludeStartTimeUtc,
}) {
  return (
    <>
      <div className="booking-panel__heading">
        <p className="eyebrow">Choose a time</p>
        <h2>{formatCalendarDateLabel(headingDate)}</h2>
        <p>{timezoneLabel}</p>
      </div>

      {timezoneField}

      <QueryState
        isLoading={slotsQuery.isLoading}
        error={slotsQuery.error}
        empty={!slots?.length && emptyMessage}
      >
        <div className="slot-list slot-list--dense">
          {slots?.map((slot) =>
            slot.startTimeUtc === excludeStartTimeUtc ? null : (
              <button
                className={
                  selectedSlot?.startTimeUtc === slot.startTimeUtc
                    ? 'slot-button slot-button--active'
                    : 'slot-button'
                }
                key={slot.startTimeUtc}
                onClick={() => onSelectSlot(slot)}
                type="button"
              >
                {slot.label}
              </button>
            ),
          )}
        </div>
      </QueryState>
    </>
  )
}
