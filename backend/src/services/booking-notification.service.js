const {
  sendBookingCancelledEmails,
  sendBookingCreatedEmails,
  sendBookingRequestedRescheduleEmails,
  sendBookingRescheduledEmails,
} = require('./email.service')

function notifyBookingCreated(booking) {
  void sendBookingCreatedEmails(booking)
}

function notifyBookingCancelled(booking, reason) {
  void sendBookingCancelledEmails(booking, reason)
}

function notifyBookingRescheduled({ booking, previousBooking, initiatedBy, reason }) {
  void sendBookingRescheduledEmails({
    booking,
    previousBooking,
    initiatedBy,
    reason,
  })
}

function notifyBookingRescheduleRequested({ booking, reason, rebookPath }) {
  void sendBookingRequestedRescheduleEmails({
    booking,
    reason,
    rebookPath,
  })
}

module.exports = {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyBookingRescheduleRequested,
  notifyBookingRescheduled,
}
