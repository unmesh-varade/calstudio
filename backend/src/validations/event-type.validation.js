const { z } = require('zod');

const { slugSchema } = require('./shared');

const booleanSchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

const eventTypeBodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  durationMinutes: z.coerce.number().int().positive().max(480),
  slug: slugSchema,
  scheduleId: z.coerce.number().int().positive().optional(),
  isActive: booleanSchema.optional(),
});

const createEventTypeSchema = eventTypeBodySchema;

const updateEventTypeSchema = eventTypeBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');

const eventTypeIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = {
  createEventTypeSchema,
  eventTypeIdSchema,
  updateEventTypeSchema,
};
