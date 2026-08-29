import { Router } from 'express';
import { metaController } from './meta.controller';
import { authMiddleware } from '../../../middleware/auth';
import { tenantContextMiddleware } from '../../../middleware/tenantContext';
import { verifyMetaSignature } from '../../../middleware/webhookVerify';

const router = Router();

// OAuth Callback (Public - Meta browser redirect)
router.get('/auth/meta/callback', tenantContextMiddleware, (req, res) =>
  metaController.handleOAuthCallback(req, res)
);

// Meta Webhook Handshake (GET)
router.get('/webhooks/meta', (req, res) => metaController.handleWebhookHandshake(req, res));

// Meta Real-Time Lead Event Receiver (POST)
router.post('/webhooks/meta', verifyMetaSignature, (req, res) =>
  metaController.handleWebhookEvent(req, res)
);

// Meta Connection Status & Disconnect
router.get('/meta/status', authMiddleware, tenantContextMiddleware, (req, res) =>
  metaController.getStatus(req, res)
);

router.post('/meta/disconnect', authMiddleware, tenantContextMiddleware, (req, res) =>
  metaController.disconnect(req, res)
);

export default router;
