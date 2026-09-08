import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

import { env } from '../src/config/env.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 5,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool, {
    disposeExternalPool: true,
  }),
});

async function main() {
  await prisma.bookingAnswer.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.eventTypeQuestion.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared all table data.');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
