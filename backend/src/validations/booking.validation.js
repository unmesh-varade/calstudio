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
  timezone: timeZoneSchema.optional(),
});

const bookingAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  value: z.string().trim().max(2000),
});

const createPublicBookingSchema = z.object({
  username: usernameSchema,
  slug: slugSchema,
  date: dateSchema,
  time: timeSchema,
  attendeeName: z.string().trim().min(1).max(120),
  attendeeEmail: z.string().trim().email(),
  attendeeTimezone: timeZoneSchema.optional(),
  answers: z.array(bookingAnswerSchema).max(8).default([]),
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
