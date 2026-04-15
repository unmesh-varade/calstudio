const prisma = require('../db/prisma');
const { createHttpError } = require('../utils/http-error');

async function getAdminUserOrThrow() {
  const admin = await prisma.user.findFirst({
    orderBy: {
      id: 'asc',
    },
  });

  if (!admin) {
    throw createHttpError(404, 'No admin user exists yet. Run the seed script first.');
  }

  return admin;
}

async function getDefaultScheduleOrThrow(userId) {
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    include: {
      rules: {
        orderBy: {
          weekday: 'asc',
        },
      },
    },
  });

  if (!schedule) {
    throw createHttpError(404, 'Default availability schedule not found.');
  }

  return schedule;
}

async function ensureScheduleBelongsToAdmin(scheduleId, userId) {
  const schedule = await prisma.availabilitySchedule.findFirst({
    where: {
      id: scheduleId,
      userId,
    },
  });

  if (!schedule) {
    throw createHttpError(404, 'Availability schedule not found for the default admin.');
  }

  return schedule;
}

module.exports = {
  ensureScheduleBelongsToAdmin,
  getAdminUserOrThrow,
  getDefaultScheduleOrThrow,
};
