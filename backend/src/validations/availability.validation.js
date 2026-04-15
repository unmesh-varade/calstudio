const { z } = require('zod');

const { timeStringToMinutes } = require('../utils/time');
const { timeSchema, timeZoneSchema } = require('./shared');

const availabilityRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine(
    (rule) => timeStringToMinutes(rule.endTime) > timeStringToMinutes(rule.startTime),
    {
      message: 'endTime must be later than startTime.',
      path: ['endTime'],
    },
  );

const updateAvailabilitySchema = z
  .object({
    name: z.string().trim().min(1).max(100).default('Default availability'),
    timezone: timeZoneSchema,
    rules: z.array(availabilityRuleSchema).min(1).max(7),
  })
  .superRefine((value, context) => {
    const seenWeekdays = new Set();

    value.rules.forEach((rule, index) => {
      if (seenWeekdays.has(rule.weekday)) {
        context.addIssue({
          code: 'custom',
          path: ['rules', index, 'weekday'],
          message: 'Each weekday can only appear once.',
        });
      }

      seenWeekdays.add(rule.weekday);
    });
  });

module.exports = {
  updateAvailabilitySchema,
};
