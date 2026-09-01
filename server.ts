import 'dotenv/config';
import { createApp } from './server/app';
import { startServer } from './server/server';

export { createApp, startServer };

// Start the server when run directly via `npm run dev` (tsx server.ts)
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
