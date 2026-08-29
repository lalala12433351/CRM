import 'dotenv/config';
import { createApp } from './app';
import { initializeAwsDbTables } from './config/database';
import { initializePaymentTables } from './modules/payments/payment.repository';
import { logger } from './utils/logger';

// Process-level crash prevention
process.on('unhandledRejection', (reason, promise) => {
  logger.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

// Initialize database tables in background
initializeAwsDbTables()
  .then(() => initializePaymentTables())
  .catch((err) => logger.warn('Database initialization notice:', err?.message || err));

export async function startServer() {
  const app = await createApp();
  const PORT = process.env.PORT || 8080;
  const serverPort = Number(PORT) || 8080;

  app.listen(serverPort, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${serverPort}`);
  });

  return app;
}

// Auto-start if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}
