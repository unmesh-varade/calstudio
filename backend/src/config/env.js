const { z } = require('zod');

require('dotenv').config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  EMAIL_FROM: z.string().trim().optional(),
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_SECURE: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
});

const parsed = envSchema.parse(process.env);

function normalizeDatabaseUrl(url) {
  const trimmed = url.trim();

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

module.exports = {
  env: {
    port: parsed.PORT,
    databaseUrl: normalizeDatabaseUrl(parsed.DATABASE_URL),
    corsOrigins: parsed.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    emailFrom: parsed.EMAIL_FROM || 'no-reply@cal.local',
    smtp: parsed.SMTP_HOST
      ? {
          host: parsed.SMTP_HOST,
          port: parsed.SMTP_PORT || 587,
          user: parsed.SMTP_USER,
          pass: parsed.SMTP_PASS,
          secure: parsed.SMTP_SECURE === true || parsed.SMTP_SECURE === 'true',
        }
      : null,
  },
};
