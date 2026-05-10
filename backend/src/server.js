import app from './app.js';
import { env } from './config/env.js';
import { healthcheckDb, pool } from './config/db.js';

async function start() {
  try {
    await healthcheckDb();

    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`SPARTAN-G backend listening on port ${env.port}`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

start();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
