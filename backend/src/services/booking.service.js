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
const {
  sendBookingCancelledEmails,
  sendBookingCreatedEmails,
} = require('./email.service');

const bookingInclude = {
  answers: {
    orderBy: {
      createdAt: 'asc',
    },
  },
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
      bufferMinutes: booking.eventType.bufferMinutes,
      timezone: scheduleTimeZone,
      organizer: {
        name: booking.eventType.user.name,
        email: booking.eventType.user.email,
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
      questions: {
        orderBy: {
          sortOrder: 'asc',
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
      questions: {
        orderBy: {
          sortOrder: 'asc',
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
      eventType: {
        select: {
          bufferMinutes: true,
        },
      },
    },
  });

  const slots = generateAvailableSlots({
    dateString,
    timeZone: eventType.schedule.timezone,
    startTime: rule.startTime,
    endTime: rule.endTime,
    durationMinutes: eventType.durationMinutes,
    bufferMinutes: eventType.bufferMinutes,
    bookedRanges: scheduledBookings.map((booking) => ({
      start: booking.startTimeUtc,
      end: addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes),
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
  const occupiedMinutes = eventType.durationMinutes + eventType.bufferMinutes;

  if (
    !isSlotWithinWindow(
      slotStartMinutes,
      occupiedMinutes,
      windowStartMinutes,
      windowEndMinutes,
    )
  ) {
    throw createHttpError(400, 'The selected slot falls outside the availability window.');
  }

  if (!isSlotAligned(slotStartMinutes, windowStartMinutes, occupiedMinutes)) {
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

function normalizeBookingAnswers(eventType, submittedAnswers = []) {
  const submittedByQuestionId = new Map(
    submittedAnswers.map((answer) => [answer.questionId, answer.value.trim()]),
  );

  return eventType.questions.map((question) => {
    const value = submittedByQuestionId.get(question.id) || '';

    if (question.isRequired && !value) {
      throw createHttpError(400, `Please answer "${question.label}".`);
    }

    if (value.length > 2000) {
      throw createHttpError(400, `"${question.label}" is too long.`);
    }

    return {
      questionId: question.id,
      questionLabel: question.label,
      questionType: question.type,
      value,
    };
  });
}

async function createPublicBooking(payload) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(payload.username, payload.slug);
  const bookingWindow = buildBookingWindow(eventType, payload.date, payload.time);
  const normalizedAnswers = normalizeBookingAnswers(eventType, payload.answers);

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${eventType.userId})`;

    const conflictingBookings = await tx.booking.findMany({
      where: {
        userId: eventType.userId,
        status: 'scheduled',
        endTimeUtc: {
          gt: bookingWindow.startTimeUtc,
        },
      },
      include: {
        eventType: {
          select: {
            bufferMinutes: true,
          },
        },
      },
    });

    const newOccupiedEnd = addMinutes(bookingWindow.endTimeUtc, eventType.bufferMinutes);
    const conflictingBooking = conflictingBookings.find(
      (booking) =>
        booking.startTimeUtc < newOccupiedEnd &&
        addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes) > bookingWindow.startTimeUtc,
    );

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
    });
  });

  const serializedBooking = serializeBooking(booking);
  void sendBookingCreatedEmails(serializedBooking);
  return serializedBooking;
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

  const serializedBooking = serializeBooking(booking);
  void sendBookingCancelledEmails(serializedBooking);
  return serializedBooking;
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
