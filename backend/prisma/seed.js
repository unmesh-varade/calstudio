require('dotenv').config();

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const { env } = require('../src/config/env');
const {
  addDaysToDateString,
  addMinutes,
  formatDateTimeInTimeZone,
  getWeekdayFromDateString,
  zonedLocalTimeToUtc,
} = require('../src/utils/time');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.databaseUrl,
  }),
});

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

function findWeekday(dateString, targetWeekday, direction) {
  let cursor = dateString;

  while (getWeekdayFromDateString(cursor) !== targetWeekday) {
    cursor = addDaysToDateString(cursor, direction);
  }

  return cursor;
}

function buildBooking({
  userId,
  eventType,
  dateString,
  time,
  attendeeName,
  attendeeEmail,
  attendeeTimezone,
  status = 'scheduled',
}) {
  const startTimeUtc = zonedLocalTimeToUtc(dateString, time, eventType.schedule.timezone);
  const endTimeUtc = addMinutes(startTimeUtc, eventType.durationMinutes);

  return {
    userId,
    eventTypeId: eventType.id,
    attendeeName,
    attendeeEmail,
    attendeeTimezone,
    startTimeUtc,
    endTimeUtc,
    status,
    cancelledAt: status === 'cancelled' ? new Date() : null,
  };
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      username: 'codemorty',
      name: 'Alex Morgan',
      email: 'alex@cal.local',
      defaultTimezone: DEFAULT_TIMEZONE,
    },
  });

  const schedule = await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: 'Default availability',
      timezone: DEFAULT_TIMEZONE,
      isDefault: true,
      rules: {
        create: [1, 2, 3, 4, 5].map((weekday) => ({
          weekday,
          startTime: '09:00',
          endTime: '17:00',
        })),
      },
    },
    include: {
      rules: true,
    },
  });

  const introCall = await prisma.eventType.create({
    data: {
      userId: user.id,
      scheduleId: schedule.id,
      title: 'Intro Call',
      slug: 'intro-call',
      description: 'A quick intro call to understand goals and next steps.',
      durationMinutes: 30,
      bufferMinutes: 15,
      isActive: true,
    },
  });

  const projectReview = await prisma.eventType.create({
    data: {
      userId: user.id,
      scheduleId: schedule.id,
      title: 'Project Review',
      slug: 'project-review',
      description: 'A focused working session for reviewing progress and blockers.',
      durationMinutes: 45,
      bufferMinutes: 0,
      isActive: true,
    },
  });

  const today = formatDateTimeInTimeZone(new Date(), DEFAULT_TIMEZONE).date;
  const nextTuesday = findWeekday(addDaysToDateString(today, 1), 2, 1);
  const nextWednesday = findWeekday(addDaysToDateString(today, 1), 3, 1);
  const nextFriday = findWeekday(addDaysToDateString(today, 1), 5, 1);
  const previousMonday = findWeekday(addDaysToDateString(today, -1), 1, -1);
  const previousThursday = findWeekday(addDaysToDateString(today, -1), 4, -1);

  const introCallWithSchedule = { ...introCall, schedule };
  const projectReviewWithSchedule = { ...projectReview, schedule };

  await prisma.booking.createMany({
    data: [
      buildBooking({
        userId: user.id,
        eventType: introCallWithSchedule,
        dateString: nextTuesday,
        time: '10:00',
        attendeeName: 'Priya Sharma',
        attendeeEmail: 'priya@example.com',
        attendeeTimezone: 'Asia/Kolkata',
      }),
      buildBooking({
        userId: user.id,
        eventType: projectReviewWithSchedule,
        dateString: nextWednesday,
        time: '14:00',
        attendeeName: 'Sam Carter',
        attendeeEmail: 'sam@example.com',
        attendeeTimezone: 'Europe/London',
      }),
      buildBooking({
        userId: user.id,
        eventType: introCallWithSchedule,
        dateString: previousMonday,
        time: '11:00',
        attendeeName: 'Mina Patel',
        attendeeEmail: 'mina@example.com',
        attendeeTimezone: 'Asia/Dubai',
      }),
      buildBooking({
        userId: user.id,
        eventType: projectReviewWithSchedule,
        dateString: previousThursday,
        time: '15:00',
        attendeeName: 'David Miller',
        attendeeEmail: 'david@example.com',
        attendeeTimezone: 'America/New_York',
      }),
      buildBooking({
        userId: user.id,
        eventType: introCallWithSchedule,
        dateString: nextFriday,
        time: '09:00',
        attendeeName: 'Leena Iyer',
        attendeeEmail: 'leena@example.com',
        attendeeTimezone: 'Asia/Kolkata',
        status: 'cancelled',
      }),
    ],
  });

  console.log('Seeded default admin, availability, event types, and sample bookings.');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
