const prisma = require('../db/prisma');
const { createHttpError } = require('../utils/http-error');
const { generateAvailableSlots, isSlotAligned, isSlotWithinWindow } = require('../utils/scheduling');
const {
  addMinutes,
  formatDateLabel,
  formatDateTimeInTimeZone,
  formatTimeLabel,
  getUtcRangeForLocalDay,
  getWeekdayFromDateString,
  timeStringToMinutes,
  zonedLocalTimeToUtc,
} = require('../utils/time');
const { getAdminUserOrThrow } = require('./admin.service');

const bookingInclude = {
  eventType: {
    include: {
      user: true,
      schedule: true,
    },
  },
};

function serializeEventTypeForPublic(eventType) {
  return {
    id: eventType.id,
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    timezone: eventType.schedule.timezone,
    organizer: {
      username: eventType.user.username,
      name: eventType.user.name,
      email: eventType.user.email,
    },
  };
}

function serializeBooking(booking) {
  const scheduleTimeZone = booking.eventType.schedule.timezone;
  const localStart = formatDateTimeInTimeZone(booking.startTimeUtc, scheduleTimeZone);
  const localEnd = formatDateTimeInTimeZone(booking.endTimeUtc, scheduleTimeZone);

  return {
    id: booking.id,
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    attendeeTimezone: booking.attendeeTimezone,
    status: booking.status,
    cancelledAt: booking.cancelledAt,
    startTimeUtc: booking.startTimeUtc.toISOString(),
    endTimeUtc: booking.endTimeUtc.toISOString(),
    localStart: {
      date: localStart.date,
      time: localStart.time,
      label: `${formatDateLabel(booking.startTimeUtc, scheduleTimeZone)} at ${formatTimeLabel(
        booking.startTimeUtc,
        scheduleTimeZone,
      )}`,
      timeZone: scheduleTimeZone,
    },
    localEnd: {
      date: localEnd.date,
      time: localEnd.time,
      label: `${formatDateLabel(booking.endTimeUtc, scheduleTimeZone)} at ${formatTimeLabel(
        booking.endTimeUtc,
        scheduleTimeZone,
      )}`,
      timeZone: scheduleTimeZone,
    },
    eventType: {
      id: booking.eventType.id,
      title: booking.eventType.title,
      slug: booking.eventType.slug,
      durationMinutes: booking.eventType.durationMinutes,
      timezone: scheduleTimeZone,
    },
    organizerUsername: booking.eventType.user.username,
  };
}

async function getActiveEventTypeBySlugOrThrow(slug) {
  const eventType = await prisma.eventType.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      user: true,
      schedule: {
        include: {
          rules: {
            orderBy: {
              weekday: 'asc',
            },
          },
        },
      },
    },
  });

  if (!eventType) {
    throw createHttpError(404, 'Public event type not found.');
  }

  return eventType;
}

async function getActiveEventTypeByUsernameAndSlugOrThrow(username, slug) {
  const eventType = await prisma.eventType.findFirst({
    where: {
      slug,
      isActive: true,
      user: {
        username,
      },
    },
    include: {
      user: true,
      schedule: {
        include: {
          rules: {
            orderBy: {
              weekday: 'asc',
            },
          },
        },
      },
    },
  });

  if (!eventType) {
    throw createHttpError(404, 'Public event type not found.');
  }

  return eventType;
}

function getRuleForDate(eventType, dateString) {
  const weekday = getWeekdayFromDateString(dateString);
  return eventType.schedule.rules.find((rule) => rule.weekday === weekday) || null;
}

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
  });

  if (!user) {
    throw createHttpError(404, 'Public profile not found.');
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
  };
}

async function getPublicEventType(username, slug) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(username, slug);
  return serializeEventTypeForPublic(eventType);
}

async function getAvailableSlots(username, slug, dateString) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(username, slug);
  const rule = getRuleForDate(eventType, dateString);

  if (!rule) {
    return {
      date: dateString,
      timeZone: eventType.schedule.timezone,
      eventType: serializeEventTypeForPublic(eventType),
      slots: [],
    };
  }

  const dayRange = getUtcRangeForLocalDay(dateString, eventType.schedule.timezone);
  const scheduledBookings = await prisma.booking.findMany({
    where: {
      userId: eventType.userId,
      status: 'scheduled',
      startTimeUtc: {
        lt: dayRange.end,
      },
      endTimeUtc: {
        gt: dayRange.start,
      },
    },
    select: {
      startTimeUtc: true,
      endTimeUtc: true,
    },
  });

  const slots = generateAvailableSlots({
    dateString,
    timeZone: eventType.schedule.timezone,
    startTime: rule.startTime,
    endTime: rule.endTime,
    durationMinutes: eventType.durationMinutes,
    bookedRanges: scheduledBookings.map((booking) => ({
      start: booking.startTimeUtc,
      end: booking.endTimeUtc,
    })),
  });

  return {
    date: dateString,
    timeZone: eventType.schedule.timezone,
    eventType: serializeEventTypeForPublic(eventType),
    slots: slots.map((slot) => ({
      time: slot.time,
      label: formatTimeLabel(slot.startUtc, eventType.schedule.timezone),
      startTimeUtc: slot.startUtc.toISOString(),
      endTimeUtc: slot.endUtc.toISOString(),
    })),
  };
}

function buildBookingWindow(eventType, dateString, timeString) {
  const rule = getRuleForDate(eventType, dateString);

  if (!rule) {
    throw createHttpError(400, 'This event type is not available on the selected day.');
  }

  const slotStartMinutes = timeStringToMinutes(timeString);
  const windowStartMinutes = timeStringToMinutes(rule.startTime);
  const windowEndMinutes = timeStringToMinutes(rule.endTime);

  if (
    !isSlotWithinWindow(
      slotStartMinutes,
      eventType.durationMinutes,
      windowStartMinutes,
      windowEndMinutes,
    )
  ) {
    throw createHttpError(400, 'The selected slot falls outside the availability window.');
  }

  if (!isSlotAligned(slotStartMinutes, windowStartMinutes, eventType.durationMinutes)) {
    throw createHttpError(400, 'The selected slot does not align with the event duration.');
  }

  const startTimeUtc = zonedLocalTimeToUtc(dateString, timeString, eventType.schedule.timezone);

  if (startTimeUtc <= new Date()) {
    throw createHttpError(400, 'The selected slot is already in the past.');
  }

  return {
    startTimeUtc,
    endTimeUtc: addMinutes(startTimeUtc, eventType.durationMinutes),
  };
}

async function createPublicBooking(payload) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(payload.username, payload.slug);
  const bookingWindow = buildBookingWindow(eventType, payload.date, payload.time);

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${eventType.userId})`;

    const conflictingBooking = await tx.booking.findFirst({
      where: {
        userId: eventType.userId,
        status: 'scheduled',
        startTimeUtc: {
          lt: bookingWindow.endTimeUtc,
        },
        endTimeUtc: {
          gt: bookingWindow.startTimeUtc,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflictingBooking) {
      throw createHttpError(409, 'That time has just been booked. Please pick another slot.');
    }

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
      },
      include: bookingInclude,
    });
  });

  return serializeBooking(booking);
}

async function getPublicBookingConfirmation(bookingId, attendeeEmail) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      attendeeEmail,
    },
    include: bookingInclude,
  });

  if (!booking) {
    throw createHttpError(404, 'Booking confirmation not found.');
  }

  return serializeBooking(booking);
}

async function listBookings(view) {
  const admin = await getAdminUserOrThrow();
  const now = new Date();
  const where = {
    userId: admin.id,
  };
  let orderBy = {
    startTimeUtc: 'asc',
  };

  if (view === 'cancelled') {
    where.status = 'cancelled';
    orderBy = {
      updatedAt: 'desc',
    };
  } else if (view === 'past') {
    where.status = 'scheduled';
    where.endTimeUtc = {
      lt: now,
    };
    orderBy = {
      startTimeUtc: 'desc',
    };
  } else {
    where.status = 'scheduled';
    where.endTimeUtc = {
      gte: now,
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy,
  });

  return bookings.map(serializeBooking);
}

async function cancelBooking(id) {
  const admin = await getAdminUserOrThrow();
  const existingBooking = await prisma.booking.findFirst({
    where: {
      id,
      userId: admin.id,
    },
    include: bookingInclude,
  });

  if (!existingBooking) {
    throw createHttpError(404, 'Booking not found.');
  }

  if (existingBooking.status === 'cancelled') {
    return serializeBooking(existingBooking);
  }

  const booking = await prisma.booking.update({
    where: {
      id,
    },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
    },
    include: bookingInclude,
  });

  return serializeBooking(booking);
}

module.exports = {
  cancelBooking,
  createPublicBooking,
  getAvailableSlots,
  getPublicBookingConfirmation,
  getPublicProfile,
  getPublicEventType,
  listBookings,
};
