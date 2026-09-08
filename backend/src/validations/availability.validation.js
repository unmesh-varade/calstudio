import { z } from 'zod';

import { timeStringToMinutes } from '../utils/time.js';
import { timeSchema, timeZoneSchema } from './shared.js';

export const availabilityRuleSchema = z
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

export const updateAvailabilitySchema = z
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

export default {
  availabilityRuleSchema,
  updateAvailabilitySchema,
};
