import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authMiddleware } from '../../middleware/auth';
import { tenantContextMiddleware } from '../../middleware/tenantContext';

const router = Router();

// Protected payment endpoints
router.post(
  '/payments/create-order',
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.createOrder(req, res)
);

router.post(
  '/payments/verify',
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.verifyPayment(req, res)
);

router.post(
  '/payments/create-link',
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.createPaymentLink(req, res)
);

router.get(
  '/payments/transactions',
  authMiddleware,
  tenantContextMiddleware,
  (req, res) => paymentController.getTransactions(req, res)
);

// Public webhook endpoint for Razorpay
router.post('/webhooks/razorpay', (req, res) => paymentController.handleWebhook(req, res));

export default router;
