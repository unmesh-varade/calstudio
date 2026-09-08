import {
  sendBookingCancelledEmails,
  sendBookingCreatedEmails,
  sendBookingRequestedRescheduleEmails,
  sendBookingRescheduledEmails,
} from './email.service.js';

export function notifyBookingCreated(booking) {
  void sendBookingCreatedEmails(booking);
}

export function notifyBookingCancelled(booking, reason) {
  void sendBookingCancelledEmails(booking, reason);
}

export function notifyBookingRescheduled({ booking, previousBooking, initiatedBy, reason }) {
  void sendBookingRescheduledEmails({
    booking,
    previousBooking,
    initiatedBy,
    reason,
  });
}

export function notifyBookingRescheduleRequested({ booking, reason, rebookPath }) {
  void sendBookingRequestedRescheduleEmails({
    booking,
    reason,
    rebookPath,
  });
}

export default {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyBookingRescheduleRequested,
  notifyBookingRescheduled,
};
