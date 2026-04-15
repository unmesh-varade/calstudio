const {
  addMinutes,
  minutesToTimeString,
  timeStringToMinutes,
  zonedLocalTimeToUtc,
} = require('./time');

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function isSlotWithinWindow(startMinutes, durationMinutes, windowStartMinutes, windowEndMinutes) {
  return (
    startMinutes >= windowStartMinutes &&
    startMinutes + durationMinutes <= windowEndMinutes
  );
}

function isSlotAligned(startMinutes, windowStartMinutes, intervalMinutes) {
  return (startMinutes - windowStartMinutes) % intervalMinutes === 0;
}

function generateAvailableSlots({
  dateString,
  timeZone,
  startTime,
  endTime,
  durationMinutes,
  bufferMinutes = 0,
  bookedRanges = [],
  now = new Date(),
}) {
  const windowStartMinutes = timeStringToMinutes(startTime);
  const windowEndMinutes = timeStringToMinutes(endTime);
  const occupiedMinutes = durationMinutes + bufferMinutes;
  const slots = [];

  for (
    let slotStartMinutes = windowStartMinutes;
    slotStartMinutes + occupiedMinutes <= windowEndMinutes;
    slotStartMinutes += occupiedMinutes
  ) {
    const time = minutesToTimeString(slotStartMinutes);
    const startUtc = zonedLocalTimeToUtc(dateString, time, timeZone);
    const endUtc = addMinutes(startUtc, durationMinutes);

    if (startUtc <= now) {
      continue;
    }

    const overlapsExisting = bookedRanges.some((bookingRange) =>
      rangesOverlap(startUtc, endUtc, bookingRange.start, bookingRange.end),
    );

    if (!overlapsExisting) {
      slots.push({
        time,
        startUtc,
        endUtc,
      });
    }
  }

  return slots;
}

module.exports = {
  generateAvailableSlots,
  isSlotAligned,
  isSlotWithinWindow,
  rangesOverlap,
};
