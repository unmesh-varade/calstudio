import {
  addMinutes,
  minutesToTimeString,
  timeStringToMinutes,
  zonedLocalTimeToUtc,
} from './time.js';

export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isSlotWithinWindow(startMinutes, durationMinutes, windowStartMinutes, windowEndMinutes) {
  return (
    startMinutes >= windowStartMinutes &&
    startMinutes + durationMinutes <= windowEndMinutes
  );
}

export function isSlotAligned(startMinutes, windowStartMinutes, intervalMinutes) {
  return (startMinutes - windowStartMinutes) % intervalMinutes === 0;
}

export function generateAvailableSlots({
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

    const occupiedEndUtc = addMinutes(endUtc, bufferMinutes);
    const overlapsExisting = bookedRanges.some((bookingRange) =>
      rangesOverlap(startUtc, occupiedEndUtc, bookingRange.start, bookingRange.end),
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

export default {
  generateAvailableSlots,
  isSlotAligned,
  isSlotWithinWindow,
  rangesOverlap,
};
