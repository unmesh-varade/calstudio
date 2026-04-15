const app = require('./app');
const { env } = require('./config/env');
const prisma = require('./db/prisma');

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
