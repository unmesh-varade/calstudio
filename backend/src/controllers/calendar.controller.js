import { getDailySchedule } from '../services/google-calendar.service.js';
import { getDailySummary } from '../services/daily-summary.service.js';

function getRequestContext(req) {
  return {
    // Replace with authenticated user id when auth middleware is enabled.
    userId: req.user?.id ?? req.query.userId ?? 'demo-user',
    date: req.query.date ?? new Date().toISOString().slice(0, 10),
    timezone: req.query.timezone ?? 'Asia/Kolkata',
  };
}

export async function getDailyScheduleController(req, res) {
  const data = await getDailySchedule(getRequestContext(req));
  res.json({ data });
}

export async function getDailySummaryController(req, res) {
  const data = await getDailySummary(getRequestContext(req));
  res.json({ data });
}
