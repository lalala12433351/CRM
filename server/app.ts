import express from 'express';
import path from 'path';
import fs from 'fs';

import paymentRoutes from './modules/payments/payment.routes';
import metaRoutes from './modules/integrations/meta/meta.routes';
import googleRoutes from './modules/integrations/google/google.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import leadRoutes from './modules/leads/lead.routes';
import authRoutes from './modules/auth/auth.routes';
import pipelineRoutes from './modules/pipelines/pipeline.routes';
import aiRoutes from './modules/ai/ai.routes';
import teamRoutes from './modules/team/team.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import callsRoutes from './modules/calls/calls.routes';
import workflowsRoutes from './modules/workflows/workflows.routes';
import templatesRoutes from './modules/templates/templates.routes';
import actionsRoutes from './modules/actions/actions.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import messagesRoutes from './modules/messages/messages.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';
import { authMiddleware } from './middleware/auth';
import { tenantContextMiddleware } from './middleware/tenantContext';

export async function createApp() {
  const app = express();
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(
    express.urlencoded({
      limit: '50mb',
      extended: true,
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    })
  );

  // Health check endpoints
  app.get(['/health', '/api/health'], (req, res) => {
    res.status(200).json({ status: 'ok', app: 'Pixbe CRM', timestamp: new Date().toISOString() });
  });

  // Global Tenant Authentication & Isolation Context for API
  app.use('/api', authMiddleware, tenantContextMiddleware);

  // Mount domain modules under /api
  app.use('/api', paymentRoutes);
  app.use('/api', metaRoutes);
  app.use('/api', googleRoutes);
  app.use('/api', integrationsRoutes);
  app.use('/api', leadRoutes);
  app.use('/api', authRoutes);
  app.use('/api', pipelineRoutes);
  app.use('/api', aiRoutes);
  app.use('/api', teamRoutes);
  app.use('/api', tasksRoutes);
  app.use('/api', callsRoutes);
  app.use('/api', workflowsRoutes);
  app.use('/api', templatesRoutes);
  app.use('/api', actionsRoutes);
  app.use('/api', campaignsRoutes);
  app.use('/api', messagesRoutes);
  app.use('/api', workspaceRoutes);

  // Serve static files in production or Vite middleware in development
  const distPath = path.join(process.cwd(), 'dist');

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application dist/index.html not found.');
      }
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: true,
          watch: {
            ignored: [
              '**/.data/**',
              '**/.git/**',
              '**/dist/**',
              '**/scratch/**',
              '**/*.zip',
              '**/*.log',
              '**/server/**'
            ]
          }
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server unavailable, serving static dist files:', err);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}
