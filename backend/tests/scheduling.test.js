const assert = require('node:assert/strict');
const test = require('node:test');

const { generateAvailableSlots, isSlotAligned, rangesOverlap } = require('../src/utils/scheduling');
const { addMinutes, zonedLocalTimeToUtc } = require('../src/utils/time');

test('rangesOverlap follows the overlap rule from the spec', () => {
  const firstStart = new Date('2026-04-15T09:00:00.000Z');
  const firstEnd = new Date('2026-04-15T09:30:00.000Z');
  const secondStart = new Date('2026-04-15T09:15:00.000Z');
  const secondEnd = new Date('2026-04-15T10:00:00.000Z');
  const thirdStart = new Date('2026-04-15T09:30:00.000Z');
  const thirdEnd = new Date('2026-04-15T10:00:00.000Z');

  assert.equal(rangesOverlap(firstStart, firstEnd, secondStart, secondEnd), true);
  assert.equal(rangesOverlap(firstStart, firstEnd, thirdStart, thirdEnd), false);
});

test('isSlotAligned rejects off-grid slots', () => {
  assert.equal(isSlotAligned(9 * 60, 9 * 60, 30), true);
  assert.equal(isSlotAligned(9 * 60 + 15, 9 * 60, 30), false);
});

test('generateAvailableSlots skips booked and already-started slots', () => {
  const timeZone = 'Asia/Kolkata';
  const dateString = '2026-04-20';
  const blockedStart = zonedLocalTimeToUtc(dateString, '09:30', timeZone);
  const now = zonedLocalTimeToUtc(dateString, '08:50', timeZone);

  const slots = generateAvailableSlots({
    dateString,
    timeZone,
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 30,
    bookedRanges: [
      {
        start: blockedStart,
        end: addMinutes(blockedStart, 30),
      },
    ],
    now,
  });

  assert.deepEqual(
    slots.map((slot) => slot.time),
    ['09:00', '10:00'],
  );
});

test('generateAvailableSlots respects buffer minutes between meetings', () => {
  const slots = generateAvailableSlots({
    dateString: '2026-04-20',
    timeZone: 'Asia/Kolkata',
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 30,
    bufferMinutes: 15,
    now: new Date('2026-04-18T00:00:00.000Z'),
  });

  assert.deepEqual(
    slots.map((slot) => slot.time),
    ['09:00', '09:45'],
  );
});
