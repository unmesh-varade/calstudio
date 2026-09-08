import bookingService from '../services/booking.service.js';

export async function listBookings(req, res) {
  const data = await bookingService.listBookings(req.validated.query.view);
  res.json({ data });
}

export async function cancelBooking(req, res) {
  const data = await bookingService.cancelBooking(req.validated.params.id, req.validated.body?.reason);
  res.json({ data });
}

export async function getBooking(req, res) {
  const data = await bookingService.getBooking(req.validated.params.id);
  res.json({ data });
}

export async function getBookingRescheduleSlots(req, res) {
  const data = await bookingService.getBookingRescheduleSlots(
    req.validated.params.id,
    req.validated.query.date,
    req.validated.query.timezone,
  );
  res.json({ data });
}

export async function rescheduleBooking(req, res) {
  const data = await bookingService.rescheduleBookingByAdmin(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

export async function requestRescheduleBooking(req, res) {
  const data = await bookingService.requestRescheduleBooking(
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
}

export default {
  cancelBooking,
  getBooking,
  getBookingRescheduleSlots,
  listBookings,
  requestRescheduleBooking,
  rescheduleBooking,
};
