const prisma = require('../db/prisma');
const { createHttpError } = require('../utils/http-error');
const {
  ensureScheduleBelongsToAdmin,
  getAdminUserOrThrow,
  getDefaultScheduleOrThrow,
} = require('./admin.service');

function serializeEventType(eventType) {
  return {
    id: eventType.id,
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    bufferMinutes: eventType.bufferMinutes,
    isActive: eventType.isActive,
    createdAt: eventType.createdAt,
    updatedAt: eventType.updatedAt,
    bookingCount: eventType._count?.bookings ?? 0,
    questions: (eventType.questions || []).map((question) => ({
      id: question.id,
      label: question.label,
      type: question.type,
      placeholder: question.placeholder,
      isRequired: question.isRequired,
      sortOrder: question.sortOrder,
    })),
    schedule: eventType.schedule
      ? {
          id: eventType.schedule.id,
          name: eventType.schedule.name,
          timezone: eventType.schedule.timezone,
        }
      : null,
    organizerUsername: eventType.user?.username ?? null,
  };
}

function buildQuestionData(questions = []) {
  return questions.map((question, index) => ({
    label: question.label,
    type: question.type,
    placeholder: question.placeholder ?? null,
    isRequired: question.isRequired ?? false,
    sortOrder: index,
  }));
}

async function listEventTypes() {
  const admin = await getAdminUserOrThrow();
  const eventTypes = await prisma.eventType.findMany({
    where: {
      userId: admin.id,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      },
      questions: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });

  return eventTypes.map(serializeEventType);
}

async function createEventType(payload) {
  const admin = await getAdminUserOrThrow();
  const schedule =
    payload.scheduleId != null
      ? await ensureScheduleBelongsToAdmin(payload.scheduleId, admin.id)
      : await getDefaultScheduleOrThrow(admin.id);

  const eventType = await prisma.eventType.create({
    data: {
      userId: admin.id,
      scheduleId: schedule.id,
      title: payload.title,
      description: payload.description,
      slug: payload.slug,
      durationMinutes: payload.durationMinutes,
      bufferMinutes: payload.bufferMinutes ?? 0,
      isActive: payload.isActive ?? true,
      questions: {
        create: buildQuestionData(payload.questions),
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      },
      questions: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  return serializeEventType(eventType);
}

async function updateEventType(id, payload) {
  const admin = await getAdminUserOrThrow();
  const existing = await prisma.eventType.findFirst({
    where: {
      id,
      userId: admin.id,
    },
  });

  if (!existing) {
    throw createHttpError(404, 'Event type not found.');
  }

  let scheduleId = existing.scheduleId;

  if (payload.scheduleId != null) {
    const schedule = await ensureScheduleBelongsToAdmin(payload.scheduleId, admin.id);
    scheduleId = schedule.id;
  }

  const eventType = await prisma.$transaction(async (tx) => {
    if (payload.questions) {
      await tx.eventTypeQuestion.deleteMany({
        where: {
          eventTypeId: id,
        },
      });
    }

    await tx.eventType.update({
      where: {
        id,
      },
      data: {
        title: payload.title ?? existing.title,
        description: payload.description ?? existing.description,
        slug: payload.slug ?? existing.slug,
        durationMinutes: payload.durationMinutes ?? existing.durationMinutes,
        bufferMinutes: payload.bufferMinutes ?? existing.bufferMinutes,
        isActive: payload.isActive ?? existing.isActive,
        scheduleId,
        questions: payload.questions
          ? {
              create: buildQuestionData(payload.questions),
            }
          : undefined,
      },
    });

    return tx.eventType.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        questions: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });
  });

  return serializeEventType(eventType);
}

async function deleteEventType(id) {
  const admin = await getAdminUserOrThrow();
  const existing = await prisma.eventType.findFirst({
    where: {
      id,
      userId: admin.id,
    },
    include: {
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!existing) {
    throw createHttpError(404, 'Event type not found.');
  }

  if (existing._count.bookings > 0) {
    throw createHttpError(
      409,
      'This event type already has bookings. Cancel or remove those bookings before deleting it.',
    );
  }

  await prisma.eventType.delete({
    where: {
      id,
    },
  });

  return {
    id,
    deleted: true,
  };
}

module.exports = {
  createEventType,
  deleteEventType,
  listEventTypes,
  updateEventType,
};
