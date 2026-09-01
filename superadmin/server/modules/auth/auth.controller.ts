import { Request, Response } from 'express';
import { authService } from './auth.service';
import { logger } from '../../utils/logger';

export class AuthController {
  public sendOtp(req: Request, res: Response) {
    try {
      const { email, phone } = req.body || {};
      const result = authService.sendOtp(email, phone);
      res.json({
        success: true,
        message: `6-digit verification code sent to ${email || phone}`,
        demoOtp: result.code
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to send OTP' });
    }
  }

  public verifyOtp(req: Request, res: Response) {
    try {
      const { email, phone, otp } = req.body || {};
      authService.verifyOtp(email, phone, otp);
      res.json({ success: true, verified: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'OTP verification failed' });
    }
  }

  public async register(req: Request, res: Response) {
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json({
        success: true,
        token: result.token,
        tenantId: result.tenantId,
        user: result.user
      });
    } catch (e: any) {
      logger.error('Error in /api/auth/register:', e);
      res.status(400).json({ error: e.message || 'Registration failed' });
    }
  }

  public login(req: Request, res: Response) {
    try {
      const { email, password } = req.body || {};
      const result = authService.loginUser(email, password);
      res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (e: any) {
      res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  }

  public getMe(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized / Session Expired' });
      }

      const user = authService.getSession(token);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized / Session Expired' });
      }

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to fetch user session' });
    }
  }

  public logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        authService.logoutSession(token);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Logout failed' });
    }
  }
}

export const authController = new AuthController();
