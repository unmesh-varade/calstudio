import { getDailySchedule } from './google-calendar.service.js';

function minutesBetween(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

export function buildDailySummary(schedule) {
  const events = [...schedule.events].sort((a, b) => a.start.localeCompare(b.start));
  const totalMinutes = events.reduce(
    (total, event) => total + (event.durationMinutes ?? minutesBetween(event.start, event.end)),
    0,
  );

  const focusMinutes = events
    .filter((event) => event.category === 'focus')
    .reduce((total, event) => total + event.durationMinutes, 0);

  const workMinutes = events
    .filter((event) => event.category === 'work' || event.category === 'focus')
    .reduce((total, event) => total + event.durationMinutes, 0);

  const gaps = [];
  for (let i = 1; i < events.length; i += 1) {
    const gap = minutesBetween(events[i - 1].end, events[i].start);
    if (gap >= 30) gaps.push({ after: events[i - 1].summary, before: events[i].summary, minutes: gap });
  }

  const busiest = [...events].sort((a, b) => b.durationMinutes - a.durationMinutes)[0] ?? null;

  return {
    date: schedule.date,
    timezone: schedule.timezone,
    provider: schedule.provider,
    eventCount: events.length,
    totalScheduledMinutes: totalMinutes,
    totalScheduled: formatDuration(totalMinutes),
    workTime: formatDuration(workMinutes),
    focusTime: formatDuration(focusMinutes),
    busiestEvent: busiest?.summary ?? null,
    longestBreakMinutes: gaps.length ? Math.max(...gaps.map((gap) => gap.minutes)) : 0,
    highlights: events.slice(0, 5).map((event) => ({
      title: event.summary,
      start: event.start,
      end: event.end,
      category: event.category,
    })),
    recommendations: [
      ...(focusMinutes === 0 ? ['Protect a block for uninterrupted focus work.'] : []),
      ...(gaps.length === 0 ? ['Your calendar is tightly packed; leave transition time between meetings.'] : []),
      ...(events.length >= 6 ? ['You have a meeting-heavy day; avoid adding non-essential meetings.'] : []),
    ],
  };
}

export async function getDailySummary({ userId, date, timezone }) {
  const schedule = await getDailySchedule({ userId, date, timezone });
  return buildDailySummary(schedule);
}

export default { buildDailySummary, getDailySummary };
