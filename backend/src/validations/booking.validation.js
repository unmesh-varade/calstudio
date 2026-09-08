import { z } from 'zod';

import { dateSchema, slugSchema, timeSchema, timeZoneSchema, usernameSchema } from './shared.js';

export const bookingIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bookingListQuerySchema = z.object({
  view: z.enum(['upcoming', 'past', 'cancelled']).default('upcoming'),
});

export const publicProfileParamsSchema = z.object({
  username: usernameSchema,
});

export const publicSlugParamsSchema = z.object({
  username: usernameSchema,
  slug: slugSchema,
});

export const publicBookingConfirmationParamsSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export const publicBookingConfirmationQuerySchema = z.object({
  email: z.string().trim().email(),
});

export const manageTokenQuerySchema = z.object({
  token: z.string().trim().min(1),
});

export const publicSlotsQuerySchema = z.object({
  date: dateSchema,
  timezone: timeZoneSchema.optional(),
});

export const bookingAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  value: z.string().trim().max(2000),
});

export const createPublicBookingSchema = z.object({
  username: usernameSchema,
  slug: slugSchema,
  date: dateSchema,
  time: timeSchema,
  attendeeName: z.string().trim().min(1).max(120),
  attendeeEmail: z.string().trim().email(),
  attendeeTimezone: timeZoneSchema.optional(),
  answers: z.array(bookingAnswerSchema).max(8).default([]),
});

export const rescheduleBookingBodySchema = z.object({
  date: dateSchema,
  time: timeSchema,
  attendeeTimezone: timeZoneSchema.optional(),
  reason: z.string().trim().max(500).optional(),
});

export const requestRescheduleBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const publicCancelBookingBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export default {
  bookingAnswerSchema,
  bookingIdSchema,
  bookingListQuerySchema,
  createPublicBookingSchema,
  manageTokenQuerySchema,
  publicBookingConfirmationParamsSchema,
  publicBookingConfirmationQuerySchema,
  publicCancelBookingBodySchema,
  publicProfileParamsSchema,
  publicSlugParamsSchema,
  publicSlotsQuerySchema,
  requestRescheduleBodySchema,
  rescheduleBookingBodySchema,
};
