const bookingService = require('../services/booking.service');

async function getPublicEventType(req, res) {
  const data = await bookingService.getPublicEventType(
    req.validated.params.username,
    req.validated.params.slug,
  );
  res.json({ data });
}

async function getPublicSlots(req, res) {
  const data = await bookingService.getAvailableSlots(
    req.validated.params.username,
    req.validated.params.slug,
    req.validated.query.date,
    req.validated.query.timezone,
  );
  res.json({ data });
}

async function getPublicProfile(req, res) {
  const data = await bookingService.getPublicProfile(req.validated.params.username);
  res.json({ data });
}

async function createPublicBooking(req, res) {
  const data = await bookingService.createPublicBooking(req.validated.body);
  res.status(201).json({ data });
}

async function getPublicBookingConfirmation(req, res) {
  const data = await bookingService.getPublicBookingConfirmation(
    req.validated.params.bookingId,
    req.validated.query.email,
  );
  res.json({ data });
}

module.exports = {
  createPublicBooking,
  getPublicBookingConfirmation,
  getPublicProfile,
  getPublicEventType,
  getPublicSlots,
};
