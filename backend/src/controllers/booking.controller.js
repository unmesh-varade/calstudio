const bookingService = require('../services/booking.service');

async function listBookings(req, res) {
  const data = await bookingService.listBookings(req.validated.query.view);
  res.json({ data });
}

async function cancelBooking(req, res) {
  const data = await bookingService.cancelBooking(req.validated.params.id);
  res.json({ data });
}

module.exports = {
  cancelBooking,
  listBookings,
};
