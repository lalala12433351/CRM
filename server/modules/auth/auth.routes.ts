import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuthenticated } from '../../middleware/rbac';

const router = Router();

router.post('/auth/send-otp', (req, res) => authController.sendOtp(req, res));
router.post('/auth/verify-otp', (req, res) => authController.verifyOtp(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/restore', (req, res) => authController.restore(req, res));
router.get('/auth/me', (req, res) => authController.getMe(req, res));
router.put('/auth/profile', requireAuthenticated, (req, res) => authController.updateProfile(req, res));
router.post('/auth/logout', requireAuthenticated, (req, res) => authController.logout(req, res));

export default router;
