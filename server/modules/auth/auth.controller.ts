import { Request, Response } from 'express';
import { authService } from './auth.service';
import { logger } from '../../utils/logger';

export class AuthController {
  public async sendOtp(req: Request, res: Response) {
    try {
      const { email, phone, password, name, resend } = req.body || {};
      const result = await authService.sendOtp(email, phone, { password, name, resend: Boolean(resend) });
      res.json({
        success: true,
        message:
          result.via === 'cognito'
            ? `Verification code sent to ${email || phone}. Check your email.`
            : `6-digit verification code sent to ${email || phone}`,
        demoOtp: result.via === 'cognito' ? undefined : result.code,
        via: result.via
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to send OTP' });
    }
  }

  public async verifyOtp(req: Request, res: Response) {
    try {
      const { email, phone, otp } = req.body || {};
      await authService.verifyOtp(email, phone, otp);
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

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body || {};
      const result = await authService.loginUser(email, password);
      res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (e: any) {
      logger.warn('[Auth] login failed:', e?.message || e);
      res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  }

  public async getMe(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const preferredTenant = ((req.headers['x-tenant-id'] as string) || '').trim();

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized / Session Expired' });
      }

      const user = await authService.getSessionHydrated(token, preferredTenant || undefined);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized / Session Expired' });
      }

      res.json({ success: true, user });
    } catch (e: any) {
      if (String(e?.message || '').startsWith('Forbidden')) {
        return res.status(403).json({ error: e.message });
      }
      res.status(500).json({ error: e.message || 'Failed to fetch user session' });
    }
  }

  public async updateProfile(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const currentSession = token ? await authService.getSessionHydrated(token) : null;
      const tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || currentSession?.tenantId || 'company_kite_aviation';
      const isAdmin = Boolean(currentSession?.isAdmin) || currentSession?.role === 'Admin';
      const requestedId = typeof req.body?.currentId === 'string' ? req.body.currentId.trim() : '';
      const userId = isAdmin && requestedId ? requestedId : currentSession?.id;
      if (!userId || !currentSession) return res.status(401).json({ error: 'Unauthorized / Session Expired' });

      const updated = await authService.updateProfile(userId, {
        name: req.body?.name,
        newId: req.body?.newId,
        email: req.body?.email,
        phone: req.body?.phone,
        avatar: req.body?.avatar
      }, tenantId);

      res.json({
        success: true,
        message: 'User profile updated successfully',
        user: updated
      });
    } catch (e: any) {
      logger.error('Error updating user profile:', e);
      res.status(400).json({ error: e.message || 'Failed to update user profile' });
    }
  }

  public async restore(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const headerToken = authHeader.replace('Bearer ', '').trim();
      const token = (req.body?.token || headerToken || '').trim();
      const userHint = req.body?.user || {};
      const result = await authService.restoreSession(token, userHint);
      res.json({ success: true, token: result.token, user: result.user });
    } catch (e: any) {
      res.status(401).json({ success: false, error: e.message || 'Session restore failed' });
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
