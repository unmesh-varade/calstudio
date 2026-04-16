import { timezoneOptions } from '../../lib/timezones'

export function BookingTimezoneSelect({
  label,
  value,
  onChange,
}) {
  return (
    <label className="field booking-timezone-field">
      <span className="field__label">{label}</span>
      <select className="field__control" onChange={onChange} required value={value}>
        {timezoneOptions.map((timeZone) => (
          <option key={timeZone} value={timeZone}>
            {timeZone}
          </option>
        ))}
      </select>
    </label>
  )
}
