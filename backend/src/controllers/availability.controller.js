const availabilityService = require('../services/availability.service');

async function getAvailability(req, res) {
  const data = await availabilityService.getAvailability();
  res.json({ data });
}

async function updateAvailability(req, res) {
  const data = await availabilityService.upsertAvailability(req.validated.body);
  res.json({ data });
}

module.exports = {
  getAvailability,
  updateAvailability,
};
