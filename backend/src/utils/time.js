const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formatterCache = new Map();

function pad(value) {
  return String(value).padStart(2, '0');
}

function getFormatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        hour12: false,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }

  return formatterCache.get(timeZone);
}

function parseDateString(dateString) {
  if (!DATE_PATTERN.test(dateString)) {
    throw new Error('Expected a date in YYYY-MM-DD format.');
  }

  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

function parseTimeString(timeString) {
  const match = timeString.match(TIME_PATTERN);

  if (!match) {
    throw new Error('Expected a time in HH:mm format.');
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function timeStringToMinutes(timeString) {
  const { hours, minutes } = parseTimeString(timeString);
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDaysToDateString(dateString, amount) {
  const { year, month, day } = parseDateString(dateString);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function getWeekdayFromDateString(dateString) {
  const { year, month, day } = parseDateString(dateString);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getTimeZoneParts(date, timeZone) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function formatDateTimeInTimeZone(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);

  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    timeWithSeconds: `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`,
  };
}

function getTimeZoneOffsetMinutes(timeZone, date) {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0,
  );

  return (asUtc - date.getTime()) / 60000;
}

function zonedLocalTimeToUtc(dateString, timeString, timeZone) {
  const { year, month, day } = parseDateString(dateString);
  const { hours, minutes } = parseTimeString(timeString);

  const baseUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  let resolvedUtcMs = baseUtcMs;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(resolvedUtcMs));
    const nextUtcMs = baseUtcMs - offsetMinutes * 60 * 1000;

    if (nextUtcMs === resolvedUtcMs) {
      break;
    }

    resolvedUtcMs = nextUtcMs;
  }

  const result = new Date(resolvedUtcMs);
  const roundTrip = formatDateTimeInTimeZone(result, timeZone);

  if (roundTrip.date !== dateString || roundTrip.time !== `${pad(hours)}:${pad(minutes)}`) {
    throw new Error('The provided date and time do not resolve cleanly in the selected timezone.');
  }

  return result;
}

function getUtcRangeForLocalDay(dateString, timeZone) {
  const start = zonedLocalTimeToUtc(dateString, '00:00', timeZone);
  const end = zonedLocalTimeToUtc(addDaysToDateString(dateString, 1), '00:00', timeZone);

  return {
    start,
    end,
  };
}

function formatTimeLabel(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateLabel(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

module.exports = {
  addDaysToDateString,
  addMinutes,
  formatDateLabel,
  formatDateTimeInTimeZone,
  formatTimeLabel,
  getUtcRangeForLocalDay,
  getWeekdayFromDateString,
  minutesToTimeString,
  parseDateString,
  parseTimeString,
  timeStringToMinutes,
  zonedLocalTimeToUtc,
};
