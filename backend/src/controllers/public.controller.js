import bookingService from '../services/booking.service.js';

export async function getPublicEventType(req, res) {
  const data = await bookingService.getPublicEventType(
    req.validated.params.username,
    req.validated.params.slug,
  );
  res.json({ data });
}

export async function getPublicSlots(req, res) {
  const data = await bookingService.getAvailableSlots(
    req.validated.params.username,
    req.validated.params.slug,
    req.validated.query.date,
    req.validated.query.timezone,
  );
  res.json({ data });
}

export async function getPublicProfile(req, res) {
  const data = await bookingService.getPublicProfile(req.validated.params.username);
  res.json({ data });
}

export async function createPublicBooking(req, res) {
  const data = await bookingService.createPublicBooking(req.validated.body);
  res.status(201).json({ data });
}

export async function getPublicBookingConfirmation(req, res) {
  const data = await bookingService.getPublicBookingConfirmation(
    req.validated.params.bookingId,
    req.validated.query.email,
  );
  res.json({ data });
}

export async function getPublicManageBooking(req, res) {
  const data = await bookingService.getPublicManageBooking(
    req.validated.params.bookingId,
    req.validated.query.token,
  );
  res.json({ data });
}

export async function getPublicRescheduleSlots(req, res) {
  const data = await bookingService.getPublicRescheduleSlots(
    req.validated.params.bookingId,
    req.validated.query.token,
    req.validated.query.date,
    req.validated.query.timezone,
  );
  res.json({ data });
}

export async function reschedulePublicBooking(req, res) {
  const data = await bookingService.rescheduleBookingByGuest(
    req.validated.params.bookingId,
    req.validated.query.token,
    req.validated.body,
  );
  res.json({ data });
}

export async function cancelPublicBooking(req, res) {
  const data = await bookingService.cancelBookingByGuest(
    req.validated.params.bookingId,
    req.validated.query.token,
    req.validated.body,
  );
  res.json({ data });
}

export default {
  cancelPublicBooking,
  createPublicBooking,
  getPublicBookingConfirmation,
  getPublicEventType,
  getPublicManageBooking,
  getPublicProfile,
  getPublicRescheduleSlots,
  getPublicSlots,
  reschedulePublicBooking,
};
