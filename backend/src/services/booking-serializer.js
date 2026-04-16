const {
  formatDateLabel,
  formatDateTimeInTimeZone,
  formatTimeLabel,
} = require('../utils/time')

function serializeEventTypeForPublic(eventType) {
  return {
    id: eventType.id,
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    bufferMinutes: eventType.bufferMinutes,
    timezone: eventType.schedule.timezone,
    organizer: {
      username: eventType.user.username,
      name: eventType.user.name,
      email: eventType.user.email,
    },
    questions: (eventType.questions || []).map((question) => ({
      id: question.id,
      label: question.label,
      type: question.type,
      placeholder: question.placeholder,
      isRequired: question.isRequired,
      sortOrder: question.sortOrder,
    })),
  }
}

function buildLocalTimeLabel(date, timeZone) {
  return `${formatDateLabel(date, timeZone)} at ${formatTimeLabel(date, timeZone)}`
}

function serializeBooking(booking) {
  const scheduleTimeZone = booking.eventType.schedule.timezone
  const localStart = formatDateTimeInTimeZone(booking.startTimeUtc, scheduleTimeZone)
  const localEnd = formatDateTimeInTimeZone(booking.endTimeUtc, scheduleTimeZone)

  return {
    id: booking.id,
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    attendeeTimezone: booking.attendeeTimezone,
    manageToken: booking.manageToken,
    status: booking.status,
    cancelledAt: booking.cancelledAt,
    startTimeUtc: booking.startTimeUtc.toISOString(),
    endTimeUtc: booking.endTimeUtc.toISOString(),
    rescheduledAt: booking.rescheduledAt?.toISOString() ?? null,
    rescheduleReason: booking.rescheduleReason ?? null,
    previousStartTimeUtc: booking.previousStartTimeUtc?.toISOString() ?? null,
    previousEndTimeUtc: booking.previousEndTimeUtc?.toISOString() ?? null,
    previousLocalStart: booking.previousStartTimeUtc
      ? {
          label: buildLocalTimeLabel(booking.previousStartTimeUtc, scheduleTimeZone),
          timeZone: scheduleTimeZone,
        }
      : null,
    previousLocalEnd: booking.previousEndTimeUtc
      ? {
          label: buildLocalTimeLabel(booking.previousEndTimeUtc, scheduleTimeZone),
          timeZone: scheduleTimeZone,
        }
      : null,
    localStart: {
      date: localStart.date,
      time: localStart.time,
      label: buildLocalTimeLabel(booking.startTimeUtc, scheduleTimeZone),
      timeZone: scheduleTimeZone,
    },
    localEnd: {
      date: localEnd.date,
      time: localEnd.time,
      label: buildLocalTimeLabel(booking.endTimeUtc, scheduleTimeZone),
      timeZone: scheduleTimeZone,
    },
    eventType: {
      id: booking.eventType.id,
      title: booking.eventType.title,
      slug: booking.eventType.slug,
      description: booking.eventType.description,
      durationMinutes: booking.eventType.durationMinutes,
      bufferMinutes: booking.eventType.bufferMinutes,
      timezone: scheduleTimeZone,
      organizer: {
        name: booking.eventType.user.name,
        email: booking.eventType.user.email,
        username: booking.eventType.user.username,
      },
    },
    answers: (booking.answers || []).map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionLabel: answer.questionLabel,
      questionType: answer.questionType,
      value: answer.value,
    })),
    organizerUsername: booking.eventType.user.username,
  }
}

function buildPublicEventPath(booking) {
  return `/${booking.eventType.user.username}/${booking.eventType.slug}`
}

module.exports = {
  buildPublicEventPath,
  serializeBooking,
  serializeEventTypeForPublic,
}
