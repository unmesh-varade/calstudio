const bookingService = require('../services/booking.service');

async function listBookings(req, res) {
  const data = await bookingService.listBookings(req.validated.query.view);
  res.json({ data });
}

async function cancelBooking(req, res) {
  const data = await bookingService.cancelBooking(req.validated.params.id);
  res.json({ data });
}

async function getBooking(req, res) {
  const data = await bookingService.getBooking(req.validated.params.id);
  res.json({ data });
}

async function getBookingRescheduleSlots(req, res) {
  const data = await bookingService.getBookingRescheduleSlots(
    req.validated.params.id,
    req.validated.query.date,
    req.validated.query.timezone,
  );
  res.json({ data });
}

async function rescheduleBooking(req, res) {
  const data = await bookingService.rescheduleBookingByAdmin(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

async function requestRescheduleBooking(req, res) {
  const data = await bookingService.requestRescheduleBooking(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

module.exports = {
  cancelBooking,
  getBooking,
  getBookingRescheduleSlots,
  listBookings,
  requestRescheduleBooking,
  rescheduleBooking,
};
