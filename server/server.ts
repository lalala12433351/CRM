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
    // Start automated Meta real-time sync engine
    import('./modules/integrations/meta/meta.sync').then(({ metaSyncEngine }) => {
      metaSyncEngine.startPeriodicSync(15000); // Polls every 15s
    }).catch((err) => logger.warn('[Meta Sync Start Notice]:', err?.message));
  });

  return app;
}


