const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const { env } = require('../config/env');

const globalForPrisma = globalThis;

const pool =
  globalForPrisma.prismaPool ||
  new Pool({
    connectionString: env.databaseUrl,
    max: 10,
  });

const adapter =
  globalForPrisma.prismaAdapter ||
  new PrismaPg(pool, {
    disposeExternalPool: true,
  });

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaPool = pool;
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
