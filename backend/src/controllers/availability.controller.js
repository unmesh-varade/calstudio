import availabilityService from '../services/availability.service.js';

export async function getAvailability(req, res) {
  const data = await availabilityService.getAvailability();
  res.json({ data });
}

export async function updateAvailability(req, res) {
  const data = await availabilityService.upsertAvailability(req.validated.body);
  res.json({ data });
}

export default {
  getAvailability,
  updateAvailability,
};
