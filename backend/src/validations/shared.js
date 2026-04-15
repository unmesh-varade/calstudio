const { z } = require('zod');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidTimeZone(timeZone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch (error) {
    return false;
  }
}

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((timeZone) => isValidTimeZone(timeZone), 'Enter a valid IANA timezone.');

const dateSchema = z.string().regex(DATE_PATTERN, 'Expected YYYY-MM-DD.');
const timeSchema = z.string().regex(TIME_PATTERN, 'Expected HH:mm.');
const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers, and hyphens only.');

const usernameSchema = slugSchema;

module.exports = {
  dateSchema,
  slugSchema,
  timeSchema,
  timeZoneSchema,
  usernameSchema,
};
