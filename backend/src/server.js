import app from './app.js';
import { env } from './config/env.js';
import prisma from './db/prisma.js';

const server = app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
