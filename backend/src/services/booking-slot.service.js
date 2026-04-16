const prisma = require('../db/prisma')
const { createHttpError } = require('../utils/http-error')
const { generateAvailableSlots, isSlotAligned, isSlotWithinWindow } = require('../utils/scheduling')
const {
  addMinutes,
  formatDateTimeInTimeZone,
  formatTimeLabel,
  getUtcRangeForLocalDay,
  getWeekdayFromDateString,
  timeStringToMinutes,
  zonedLocalTimeToUtc,
} = require('../utils/time')
const { serializeEventTypeForPublic } = require('./booking-serializer')

function getRuleForDate(eventType, dateString) {
  const weekday = getWeekdayFromDateString(dateString)
  return eventType.schedule.rules.find((rule) => rule.weekday === weekday) || null
}

function unique(values) {
  return [...new Set(values)]
}

async function getSlotPayloadForEventType({ eventType, userId, dateString, viewerTimeZone, excludeBookingId }) {
  const displayTimeZone = viewerTimeZone || eventType.schedule.timezone
  const displayDayRange = getUtcRangeForLocalDay(dateString, displayTimeZone)
  const candidateEventDates = unique([
    formatDateTimeInTimeZone(displayDayRange.start, eventType.schedule.timezone).date,
    formatDateTimeInTimeZone(new Date(displayDayRange.end.getTime() - 1), eventType.schedule.timezone).date,
  ])
  const eventDateRanges = candidateEventDates.map((eventDate) => ({
    eventDate,
    rule: getRuleForDate(eventType, eventDate),
    range: getUtcRangeForLocalDay(eventDate, eventType.schedule.timezone),
  }))
  const activeEventDateRanges = eventDateRanges.filter((entry) => entry.rule)

  if (!activeEventDateRanges.length) {
    return {
      date: dateString,
      timeZone: displayTimeZone,
      eventTimeZone: eventType.schedule.timezone,
      eventType: serializeEventTypeForPublic(eventType),
      slots: [],
    }
  }

  const queryStart = activeEventDateRanges.reduce(
    (earliest, entry) => (entry.range.start < earliest ? entry.range.start : earliest),
    activeEventDateRanges[0].range.start,
  )
  const queryEnd = activeEventDateRanges.reduce(
    (latest, entry) => (entry.range.end > latest ? entry.range.end : latest),
    activeEventDateRanges[0].range.end,
  )

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
  })

  const bookedRanges = scheduledBookings.map((booking) => ({
    start: booking.startTimeUtc,
    end: addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes),
  }))

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
    .filter((slot) => slot.startUtc >= displayDayRange.start && slot.startUtc < displayDayRange.end)
    .sort((left, right) => left.startUtc - right.startUtc)

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
  }
}

function buildBookingWindow(eventType, dateString, timeString) {
  const rule = getRuleForDate(eventType, dateString)

  if (!rule) {
    throw createHttpError(400, 'This event type is not available on the selected day.')
  }

  const slotStartMinutes = timeStringToMinutes(timeString)
  const windowStartMinutes = timeStringToMinutes(rule.startTime)
  const windowEndMinutes = timeStringToMinutes(rule.endTime)
  const occupiedMinutes = eventType.durationMinutes + eventType.bufferMinutes

  if (!isSlotWithinWindow(slotStartMinutes, occupiedMinutes, windowStartMinutes, windowEndMinutes)) {
    throw createHttpError(400, 'The selected slot falls outside the availability window.')
  }

  if (!isSlotAligned(slotStartMinutes, windowStartMinutes, occupiedMinutes)) {
    throw createHttpError(400, 'The selected slot does not align with the event duration.')
  }

  const startTimeUtc = zonedLocalTimeToUtc(dateString, timeString, eventType.schedule.timezone)

  if (startTimeUtc <= new Date()) {
    throw createHttpError(400, 'The selected slot is already in the past.')
  }

  return {
    startTimeUtc,
    endTimeUtc: addMinutes(startTimeUtc, eventType.durationMinutes),
  }
}

function normalizeBookingAnswers(eventType, submittedAnswers = []) {
  const submittedByQuestionId = new Map(
    submittedAnswers.map((answer) => [answer.questionId, answer.value.trim()]),
  )

  return eventType.questions.map((question) => {
    const value = submittedByQuestionId.get(question.id) || ''

    if (question.isRequired && !value) {
      throw createHttpError(400, `Please answer "${question.label}".`)
    }

    if (value.length > 2000) {
      throw createHttpError(400, `"${question.label}" is too long.`)
    }

    return {
      questionId: question.id,
      questionLabel: question.label,
      questionType: question.type,
      value,
    }
  })
}

async function ensureNoConflict(tx, { userId, bookingWindow, eventType, excludeBookingId }) {
  const newOccupiedEnd = addMinutes(bookingWindow.endTimeUtc, eventType.bufferMinutes)
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
  })

  const conflictingBooking = conflictingBookings.find(
    (booking) =>
      booking.startTimeUtc < newOccupiedEnd &&
      addMinutes(booking.endTimeUtc, booking.eventType.bufferMinutes) > bookingWindow.startTimeUtc,
  )

  if (conflictingBooking) {
    throw createHttpError(409, 'That time has just been booked. Please pick another slot.')
  }
}

function assertBookingCanBeManaged(booking) {
  if (booking.status === 'cancelled') {
    throw createHttpError(409, 'This booking has already been cancelled.')
  }

  if (booking.endTimeUtc <= new Date()) {
    throw createHttpError(409, 'Past bookings cannot be changed.')
  }
}

module.exports = {
  assertBookingCanBeManaged,
  buildBookingWindow,
  ensureNoConflict,
  getSlotPayloadForEventType,
  normalizeBookingAnswers,
}
