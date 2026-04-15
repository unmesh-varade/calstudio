require('dotenv').config();

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const { env } = require('../src/config/env');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.databaseUrl,
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
