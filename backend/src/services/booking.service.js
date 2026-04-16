const prisma = require('../db/prisma')
const { createHttpError } = require('../utils/http-error')
const { getAdminUserOrThrow } = require('./admin.service')
const {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyBookingRescheduleRequested,
  notifyBookingRescheduled,
} = require('./booking-notification.service')
const {
  bookingInclude,
  bookingManageInclude,
  getActiveEventTypeByUsernameAndSlugOrThrow,
  getBookingByAdminOrThrow,
  getBookingByManageTokenOrThrow,
} = require('./booking.repository')
const {
  buildPublicEventPath,
  serializeBooking,
  serializeEventTypeForPublic,
} = require('./booking-serializer')
const {
  assertBookingCanBeManaged,
  buildBookingWindow,
  ensureNoConflict,
  getSlotPayloadForEventType,
  normalizeBookingAnswers,
} = require('./booking-slot.service')

async function getPublicProfile(username) {
  const user = await prisma.user.findFirst({
    where: {
      username,
    },
    include: {
      eventTypes: {
        where: {
          isActive: true,
        },
        include: {
          schedule: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!user) {
    throw createHttpError(404, 'Public profile not found.')
  }

  return {
    username: user.username,
    name: user.name,
    bio: 'Scheduling made simple.',
    timezone: user.defaultTimezone,
    eventTypes: user.eventTypes.map((eventType) => ({
      id: eventType.id,
      title: eventType.title,
      slug: eventType.slug,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
      timezone: eventType.schedule.timezone,
    })),
  }
}

async function getPublicEventType(username, slug) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(username, slug)
  return serializeEventTypeForPublic(eventType)
}

async function getAvailableSlots(username, slug, dateString, viewerTimeZone) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(username, slug)
  return getSlotPayloadForEventType({
    eventType,
    userId: eventType.userId,
    dateString,
    viewerTimeZone,
  })
}

async function createPublicBooking(payload) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(payload.username, payload.slug)
  const bookingWindow = buildBookingWindow(eventType, payload.date, payload.time)
  const normalizedAnswers = normalizeBookingAnswers(eventType, payload.answers)

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${eventType.userId})`

    await ensureNoConflict(tx, {
      userId: eventType.userId,
      bookingWindow,
      eventType,
    })

    return tx.booking.create({
      data: {
        userId: eventType.userId,
        eventTypeId: eventType.id,
        attendeeName: payload.attendeeName,
        attendeeEmail: payload.attendeeEmail,
        attendeeTimezone: payload.attendeeTimezone,
        startTimeUtc: bookingWindow.startTimeUtc,
        endTimeUtc: bookingWindow.endTimeUtc,
        status: 'scheduled',
        answers: {
          create: normalizedAnswers
            .filter((answer) => answer.value)
            .map((answer) => ({
              questionId: answer.questionId,
              questionLabel: answer.questionLabel,
              questionType: answer.questionType,
              value: answer.value,
            })),
        },
      },
      include: bookingInclude,
    })
  })

  const serializedBooking = serializeBooking(booking)
  notifyBookingCreated(serializedBooking)
  return serializedBooking
}

async function getPublicBookingConfirmation(bookingId, attendeeEmail) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      attendeeEmail,
    },
    include: bookingInclude,
  })

  if (!booking) {
    throw createHttpError(404, 'Booking confirmation not found.')
  }

  return serializeBooking(booking)
}

async function getPublicManageBooking(bookingId, token) {
  const booking = await getBookingByManageTokenOrThrow(bookingId, token, bookingInclude)
  return serializeBooking(booking)
}

async function listBookings(view) {
  const admin = await getAdminUserOrThrow()
  const now = new Date()
  const where = {
    userId: admin.id,
  }
  let orderBy = {
    startTimeUtc: 'asc',
  }

  if (view === 'cancelled') {
    where.status = 'cancelled'
    orderBy = {
      updatedAt: 'desc',
    }
  } else if (view === 'past') {
    where.status = 'scheduled'
    where.endTimeUtc = {
      lt: now,
    }
    orderBy = {
      startTimeUtc: 'desc',
    }
  } else {
    where.status = 'scheduled'
    where.endTimeUtc = {
      gte: now,
    }
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy,
  })

  return bookings.map(serializeBooking)
}

async function getBooking(id) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude)
  return serializeBooking(booking)
}

async function getBookingRescheduleSlots(id, dateString, viewerTimeZone) {
  const booking = await getBookingByAdminOrThrow(id, bookingManageInclude)
  assertBookingCanBeManaged(booking)

  return getSlotPayloadForEventType({
    eventType: booking.eventType,
    userId: booking.userId,
    dateString,
    viewerTimeZone,
    excludeBookingId: booking.id,
  })
}

async function getPublicRescheduleSlots(id, token, dateString, viewerTimeZone) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingManageInclude)
  assertBookingCanBeManaged(booking)

  return getSlotPayloadForEventType({
    eventType: booking.eventType,
    userId: booking.userId,
    dateString,
    viewerTimeZone,
    excludeBookingId: booking.id,
  })
}

async function rescheduleExistingBooking(booking, payload, initiatedBy) {
  assertBookingCanBeManaged(booking)

  const bookingWindow = buildBookingWindow(booking.eventType, payload.date, payload.time)

  if (booking.startTimeUtc.getTime() === bookingWindow.startTimeUtc.getTime()) {
    throw createHttpError(400, 'Please choose a different time for the reschedule.')
  }

  const previousBooking = serializeBooking(booking)

  const updatedBooking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${booking.userId})`

    await ensureNoConflict(tx, {
      userId: booking.userId,
      bookingWindow,
      eventType: booking.eventType,
      excludeBookingId: booking.id,
    })

    return tx.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        attendeeTimezone: payload.attendeeTimezone ?? booking.attendeeTimezone,
        startTimeUtc: bookingWindow.startTimeUtc,
        endTimeUtc: bookingWindow.endTimeUtc,
        previousStartTimeUtc: booking.startTimeUtc,
        previousEndTimeUtc: booking.endTimeUtc,
        rescheduledAt: new Date(),
        rescheduleReason: payload.reason ?? null,
        status: 'scheduled',
        cancelledAt: null,
      },
      include: bookingInclude,
    })
  })

  const serializedBooking = serializeBooking(updatedBooking)
  notifyBookingRescheduled({
    booking: serializedBooking,
    previousBooking,
    initiatedBy,
    reason: payload.reason,
  })

  return serializedBooking
}

async function rescheduleBookingByAdmin(id, payload) {
  const booking = await getBookingByAdminOrThrow(id, bookingManageInclude)
  return rescheduleExistingBooking(booking, payload, 'admin')
}

async function rescheduleBookingByGuest(id, token, payload) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingManageInclude)
  return rescheduleExistingBooking(booking, payload, 'guest')
}

async function markBookingCancelled(booking, reason, notificationMode) {
  const updatedBooking = await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      rescheduleReason: notificationMode === 'request_reschedule' ? reason ?? null : booking.rescheduleReason,
    },
    include: bookingInclude,
  })

  const serializedBooking = serializeBooking(updatedBooking)

  if (notificationMode === 'request_reschedule') {
    notifyBookingRescheduleRequested({
      booking: serializedBooking,
      reason,
      rebookPath: buildPublicEventPath(updatedBooking),
    })
  } else {
    notifyBookingCancelled(serializedBooking, reason)
  }

  return serializedBooking
}

async function cancelBooking(id, reason) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude)

  if (booking.status === 'cancelled') {
    return serializeBooking(booking)
  }

  return markBookingCancelled(booking, reason, 'cancel')
}

async function cancelBookingByGuest(id, token, payload) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingInclude)

  if (booking.status === 'cancelled') {
    return serializeBooking(booking)
  }

  return markBookingCancelled(booking, payload.reason, 'cancel')
}

async function requestRescheduleBooking(id, payload) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude)

  if (booking.status === 'cancelled') {
    return serializeBooking(booking)
  }

  return markBookingCancelled(booking, payload.reason, 'request_reschedule')
}

module.exports = {
  cancelBooking,
  cancelBookingByGuest,
  createPublicBooking,
  getAvailableSlots,
  getBooking,
  getBookingRescheduleSlots,
  getPublicBookingConfirmation,
  getPublicEventType,
  getPublicManageBooking,
  getPublicProfile,
  getPublicRescheduleSlots,
  listBookings,
  requestRescheduleBooking,
  rescheduleBookingByAdmin,
  rescheduleBookingByGuest,
}
