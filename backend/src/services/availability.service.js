import prisma from '../db/prisma.js';
import { getAdminUserOrThrow, getDefaultScheduleOrThrow } from './admin.service.js';

export function serializeSchedule(schedule) {
  return {
    id: schedule.id,
    name: schedule.name,
    timezone: schedule.timezone,
    isDefault: schedule.isDefault,
    rules: schedule.rules.map((rule) => ({
      id: rule.id,
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
    })),
  };
}

export async function getAvailability() {
  const admin = await getAdminUserOrThrow();
  const schedule = await getDefaultScheduleOrThrow(admin.id);
  return serializeSchedule(schedule);
}

export async function upsertAvailability(payload) {
  const admin = await getAdminUserOrThrow();
  const existingSchedule = await prisma.availabilitySchedule.findFirst({
    where: {
      userId: admin.id,
      isDefault: true,
    },
  });

  const schedule = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: admin.id,
      },
      data: {
        defaultTimezone: payload.timezone,
      },
    });

    let savedSchedule;

    if (existingSchedule) {
      savedSchedule = await tx.availabilitySchedule.update({
        where: {
          id: existingSchedule.id,
        },
        data: {
          name: payload.name,
          timezone: payload.timezone,
          isDefault: true,
        },
      });

      await tx.availabilityRule.deleteMany({
        where: {
          scheduleId: existingSchedule.id,
        },
      });
    } else {
      savedSchedule = await tx.availabilitySchedule.create({
        data: {
          userId: admin.id,
          name: payload.name,
          timezone: payload.timezone,
          isDefault: true,
        },
      });
    }

    await tx.availabilityRule.createMany({
      data: payload.rules.map((rule) => ({
        scheduleId: savedSchedule.id,
        weekday: rule.weekday,
        startTime: rule.startTime,
        endTime: rule.endTime,
      })),
    });

    return tx.availabilitySchedule.findUnique({
      where: {
        id: savedSchedule.id,
      },
      include: {
        rules: {
          orderBy: {
            weekday: 'asc',
          },
        },
      },
    });
  });

  return serializeSchedule(schedule);
}

export default {
  getAvailability,
  serializeSchedule,
  upsertAvailability,
};
