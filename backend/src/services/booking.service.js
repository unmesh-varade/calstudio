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
  sendBookingRequestedRescheduleEmails,
  sendBookingRescheduledEmails,
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

const bookingManageInclude = {
  answers: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  eventType: {
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

function buildLocalTimeLabel(date, timeZone) {
  return `${formatDateLabel(date, timeZone)} at ${formatTimeLabel(date, timeZone)}`;
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
  };
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

function unique(values) {
  return [...new Set(values)];
}

async function getBookingByAdminOrThrow(id, include = bookingInclude) {
  const admin = await getAdminUserOrThrow();
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: admin.id,
    },
    include,
  });

  if (!booking) {
    throw createHttpError(404, 'Booking not found.');
  }

  return booking;
}

async function getBookingByManageTokenOrThrow(id, token, include = bookingManageInclude) {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      manageToken: token,
    },
    include,
  });

  if (!booking) {
    throw createHttpError(404, 'Booking not found.');
  }

  return booking;
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

async function getSlotPayloadForEventType({ eventType, userId, dateString, viewerTimeZone, excludeBookingId }) {
  const displayTimeZone = viewerTimeZone || eventType.schedule.timezone;
  const displayDayRange = getUtcRangeForLocalDay(dateString, displayTimeZone);
  const candidateEventDates = unique([
    formatDateTimeInTimeZone(displayDayRange.start, eventType.schedule.timezone).date,
    formatDateTimeInTimeZone(new Date(displayDayRange.end.getTime() - 1), eventType.schedule.timezone)
      .date,
  ]);
  const eventDateRanges = candidateEventDates.map((eventDate) => ({
    eventDate,
    rule: getRuleForDate(eventType, eventDate),
    range: getUtcRangeForLocalDay(eventDate, eventType.schedule.timezone),
  }));
  const activeEventDateRanges = eventDateRanges.filter((entry) => entry.rule);

  if (!activeEventDateRanges.length) {
    return {
      date: dateString,
      timeZone: displayTimeZone,
      eventTimeZone: eventType.schedule.timezone,
      eventType: serializeEventTypeForPublic(eventType),
      slots: [],
    };
  }

  const queryStart = activeEventDateRanges.reduce(
    (earliest, entry) => (entry.range.start < earliest ? entry.range.start : earliest),
    activeEventDateRanges[0].range.start,
  );
  const queryEnd = activeEventDateRanges.reduce(
    (latest, entry) => (entry.range.end > latest ? entry.range.end : latest),
    activeEventDateRanges[0].range.end,
  );

  const scheduledBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: 'scheduled',
      id: excludeBookingId
        ? {
            not: excludeBookingId,
          }
        : undefined,
      startTimeUtc: {
        lt: queryEnd,
      },
      endTimeUtc: {
        gt: queryStart,
      },
    },
    select: {
      id: true,
      startTimeUtc: true,
      endTimeUtc: true,
      eventType: {
        select: {
          bufferMinutes: true,
        },
      },
    },
  });

  const bookedRanges = scheduledBookings.map((booking) => ({
    start: booking.startTimeUtc,
    end: addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes),
  }));

  const slots = activeEventDateRanges
    .flatMap(({ eventDate, rule }) =>
      generateAvailableSlots({
        dateString: eventDate,
        timeZone: eventType.schedule.timezone,
        startTime: rule.startTime,
        endTime: rule.endTime,
        durationMinutes: eventType.durationMinutes,
        bufferMinutes: eventType.bufferMinutes,
        bookedRanges,
      }).map((slot) => ({
        ...slot,
        eventDate,
      })),
    )
    .filter(
      (slot) => slot.startUtc >= displayDayRange.start && slot.startUtc < displayDayRange.end,
    )
    .sort((left, right) => left.startUtc - right.startUtc);

  return {
    date: dateString,
    timeZone: displayTimeZone,
    eventTimeZone: eventType.schedule.timezone,
    eventType: serializeEventTypeForPublic(eventType),
    slots: slots.map((slot) => ({
      time: slot.time,
      eventDate: slot.eventDate,
      label: formatTimeLabel(slot.startUtc, displayTimeZone),
      startTimeUtc: slot.startUtc.toISOString(),
      endTimeUtc: slot.endUtc.toISOString(),
    })),
  };
}

async function getAvailableSlots(username, slug, dateString, viewerTimeZone) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(username, slug);
  return getSlotPayloadForEventType({
    eventType,
    userId: eventType.userId,
    dateString,
    viewerTimeZone,
  });
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

  if (!isSlotWithinWindow(slotStartMinutes, occupiedMinutes, windowStartMinutes, windowEndMinutes)) {
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

async function ensureNoConflict(tx, { userId, bookingWindow, eventType, excludeBookingId }) {
  const newOccupiedEnd = addMinutes(bookingWindow.endTimeUtc, eventType.bufferMinutes);
  const conflictingBookings = await tx.booking.findMany({
    where: {
      userId,
      status: 'scheduled',
      id: excludeBookingId
        ? {
            not: excludeBookingId,
          }
        : undefined,
      startTimeUtc: {
        lt: newOccupiedEnd,
      },
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

  const conflictingBooking = conflictingBookings.find(
    (booking) =>
      booking.startTimeUtc < newOccupiedEnd &&
      addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes) > bookingWindow.startTimeUtc,
  );

  if (conflictingBooking) {
    throw createHttpError(409, 'That time has just been booked. Please pick another slot.');
  }
}

function assertBookingCanBeManaged(booking) {
  if (booking.status === 'cancelled') {
    throw createHttpError(409, 'This booking has already been cancelled.');
  }

  if (booking.endTimeUtc <= new Date()) {
    throw createHttpError(409, 'Past bookings cannot be changed.');
  }
}

function buildPublicEventPath(booking) {
  return `/${booking.eventType.user.username}/${booking.eventType.slug}`;
}

async function createPublicBooking(payload) {
  const eventType = await getActiveEventTypeByUsernameAndSlugOrThrow(payload.username, payload.slug);
  const bookingWindow = buildBookingWindow(eventType, payload.date, payload.time);
  const normalizedAnswers = normalizeBookingAnswers(eventType, payload.answers);

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${eventType.userId})`;

    await ensureNoConflict(tx, {
      userId: eventType.userId,
      bookingWindow,
      eventType,
    });

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

async function getPublicManageBooking(bookingId, token) {
  const booking = await getBookingByManageTokenOrThrow(bookingId, token, bookingInclude);
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

async function getBooking(id) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude);
  return serializeBooking(booking);
}

async function getBookingRescheduleSlots(id, dateString, viewerTimeZone) {
  const booking = await getBookingByAdminOrThrow(id, bookingManageInclude);
  assertBookingCanBeManaged(booking);

  return getSlotPayloadForEventType({
    eventType: booking.eventType,
    userId: booking.userId,
    dateString,
    viewerTimeZone,
    excludeBookingId: booking.id,
  });
}

async function getPublicRescheduleSlots(id, token, dateString, viewerTimeZone) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingManageInclude);
  assertBookingCanBeManaged(booking);

  return getSlotPayloadForEventType({
    eventType: booking.eventType,
    userId: booking.userId,
    dateString,
    viewerTimeZone,
    excludeBookingId: booking.id,
  });
}

async function rescheduleExistingBooking(booking, payload, initiatedBy) {
  assertBookingCanBeManaged(booking);

  const bookingWindow = buildBookingWindow(booking.eventType, payload.date, payload.time);

  if (booking.startTimeUtc.getTime() === bookingWindow.startTimeUtc.getTime()) {
    throw createHttpError(400, 'Please choose a different time for the reschedule.');
  }

  const previousBooking = serializeBooking(booking);

  const updatedBooking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${booking.userId})`;

    await ensureNoConflict(tx, {
      userId: booking.userId,
      bookingWindow,
      eventType: booking.eventType,
      excludeBookingId: booking.id,
    });

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
    });
  });

  const serializedBooking = serializeBooking(updatedBooking);
  void sendBookingRescheduledEmails({
    booking: serializedBooking,
    previousBooking,
    initiatedBy,
    reason: payload.reason,
  });

  return serializedBooking;
}

async function rescheduleBookingByAdmin(id, payload) {
  const booking = await getBookingByAdminOrThrow(id, bookingManageInclude);
  return rescheduleExistingBooking(booking, payload, 'admin');
}

async function rescheduleBookingByGuest(id, token, payload) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingManageInclude);
  return rescheduleExistingBooking(booking, payload, 'guest');
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
  });

  const serializedBooking = serializeBooking(updatedBooking);

  if (notificationMode === 'request_reschedule') {
    void sendBookingRequestedRescheduleEmails({
      booking: serializedBooking,
      reason,
      rebookPath: `/${serializedBooking.organizerUsername}/${serializedBooking.eventType.slug}`,
    });
  } else {
    void sendBookingCancelledEmails(serializedBooking, reason);
  }

  return serializedBooking;
}

async function cancelBooking(id, reason) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude);

  if (booking.status === 'cancelled') {
    return serializeBooking(booking);
  }

  return markBookingCancelled(booking, reason, 'cancel');
}

async function cancelBookingByGuest(id, token, payload) {
  const booking = await getBookingByManageTokenOrThrow(id, token, bookingInclude);

  if (booking.status === 'cancelled') {
    return serializeBooking(booking);
  }

  return markBookingCancelled(booking, payload.reason, 'cancel');
}

async function requestRescheduleBooking(id, payload) {
  const booking = await getBookingByAdminOrThrow(id, bookingInclude);

  if (booking.status === 'cancelled') {
    return serializeBooking(booking);
  }

  return markBookingCancelled(booking, payload.reason, 'request_reschedule');
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
};
