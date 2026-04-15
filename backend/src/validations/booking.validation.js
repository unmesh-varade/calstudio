const { z } = require('zod');

const { dateSchema, slugSchema, timeSchema, timeZoneSchema, usernameSchema } = require('./shared');

const bookingIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const bookingListQuerySchema = z.object({
  view: z.enum(['upcoming', 'past', 'cancelled']).default('upcoming'),
});

const publicProfileParamsSchema = z.object({
  username: usernameSchema,
});

const publicSlugParamsSchema = z.object({
  username: usernameSchema,
  slug: slugSchema,
});

const publicBookingConfirmationParamsSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

const publicBookingConfirmationQuerySchema = z.object({
  email: z.string().trim().email(),
});

const publicSlotsQuerySchema = z.object({
  date: dateSchema,
});

const createPublicBookingSchema = z.object({
  username: usernameSchema,
  slug: slugSchema,
  date: dateSchema,
  time: timeSchema,
  attendeeName: z.string().trim().min(1).max(120),
  attendeeEmail: z.string().trim().email(),
  attendeeTimezone: timeZoneSchema.optional(),
});

module.exports = {
  bookingIdSchema,
  bookingListQuerySchema,
  createPublicBookingSchema,
  publicBookingConfirmationParamsSchema,
  publicBookingConfirmationQuerySchema,
  publicProfileParamsSchema,
  publicSlugParamsSchema,
  publicSlotsQuerySchema,
};
