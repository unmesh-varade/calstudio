import prisma from '../db/prisma.js';
import { createHttpError } from '../utils/http-error.js';
import { getAdminUserOrThrow } from './admin.service.js';

export const bookingInclude = {
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

export const bookingManageInclude = {
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

export async function getActiveEventTypeByUsernameAndSlugOrThrow(username, slug) {
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

export async function getBookingByAdminOrThrow(id, include = bookingInclude) {
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

export async function getBookingByManageTokenOrThrow(id, token, include = bookingManageInclude) {
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

export default {
  bookingInclude,
  bookingManageInclude,
  getActiveEventTypeByUsernameAndSlugOrThrow,
  getBookingByAdminOrThrow,
  getBookingByManageTokenOrThrow,
};
