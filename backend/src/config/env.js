const { z } = require('zod');

require('dotenv').config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
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
  },
};
