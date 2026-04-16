const prisma = require('../db/prisma')
const { createHttpError } = require('../utils/http-error')
const { getAdminUserOrThrow } = require('./admin.service')

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
}

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
  })

  if (!eventType) {
    throw createHttpError(404, 'Public event type not found.')
  }

  return eventType
}

async function getBookingByAdminOrThrow(id, include = bookingInclude) {
  const admin = await getAdminUserOrThrow()
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: admin.id,
    },
    include,
  })

  if (!booking) {
    throw createHttpError(404, 'Booking not found.')
  }

  return booking
}

async function getBookingByManageTokenOrThrow(id, token, include = bookingManageInclude) {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      manageToken: token,
    },
    include,
  })

  if (!booking) {
    throw createHttpError(404, 'Booking not found.')
  }

  return booking
}

module.exports = {
  bookingInclude,
  bookingManageInclude,
  getActiveEventTypeByUsernameAndSlugOrThrow,
  getBookingByAdminOrThrow,
  getBookingByManageTokenOrThrow,
}
