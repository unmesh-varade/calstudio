import { z } from 'zod';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidTimeZone(timeZone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch (error) {
    return false;
  }
}

export const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((timeZone) => isValidTimeZone(timeZone), 'Enter a valid IANA timezone.');

export const dateSchema = z.string().regex(DATE_PATTERN, 'Expected YYYY-MM-DD.');
export const timeSchema = z.string().regex(TIME_PATTERN, 'Expected HH:mm.');
export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers, and hyphens only.');

export const usernameSchema = slugSchema;

export default {
  dateSchema,
  isValidTimeZone,
  slugSchema,
  timeSchema,
  timeZoneSchema,
  usernameSchema,
};
