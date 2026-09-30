import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuthenticated } from '../../middleware/rbac';
import { loginLimiter, otpLimiter, signupLimiter } from '../../middleware/rateLimits';

const router = Router();

router.post('/auth/send-otp', otpLimiter, (req, res) => authController.sendOtp(req, res));
router.post('/auth/verify-otp', otpLimiter, (req, res) => authController.verifyOtp(req, res));
router.post('/auth/register', signupLimiter, (req, res) => authController.register(req, res));
router.post('/auth/login', loginLimiter, (req, res) => authController.login(req, res));
router.post('/auth/restore', (req, res) => authController.restore(req, res));
router.get('/auth/me', (req, res) => authController.getMe(req, res));
router.put('/auth/profile', requireAuthenticated, (req, res) => authController.updateProfile(req, res));
router.post('/auth/logout', requireAuthenticated, (req, res) => authController.logout(req, res));
router.delete('/auth/account', requireAuthenticated, (req, res) => authController.deleteAccount(req, res));
router.post('/auth/password-change/request', requireAuthenticated, (req, res) =>
  authController.requestPasswordChange(req, res)
);
router.post('/auth/password-change/forgot', otpLimiter, (req, res) => authController.requestForgotPassword(req, res));
router.post('/auth/password-change/confirm', otpLimiter, (req, res) => authController.confirmPasswordChange(req, res));

export default router;
