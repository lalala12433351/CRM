import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authMiddleware } from '../../middleware/auth';
import { tenantContextMiddleware } from '../../middleware/tenantContext';
import { requireAuthenticated } from '../../middleware/rbac';
import { verifyRazorpaySignature } from '../../middleware/webhookVerify';

const router = Router();

// Protected payment endpoints
router.post(
  '/payments/create-order',
  requireAuthenticated,
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.createOrder(req, res)
);

router.post(
  '/payments/verify',
  requireAuthenticated,
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.verifyPayment(req, res)
);

router.post(
  '/payments/create-link',
  requireAuthenticated,
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.createPaymentLink(req, res)
);

router.get(
  '/payments/transactions',
  requireAuthenticated,
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.getTransactions(req, res)
);

// Razorpay callback. Production rejects it until RAZORPAY_WEBHOOK_SECRET is a real secret.
router.post('/webhooks/razorpay', verifyRazorpaySignature, (req, res) => paymentController.handleWebhook(req, res));

export default router;
