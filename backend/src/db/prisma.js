import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

import { env } from '../config/env.js';

const { Pool } = pg;

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

export const prisma =
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

export default prisma;
