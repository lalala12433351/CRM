import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

const jsonMessage = (error: string) => ({ error });

/** AI calls are expensive. Limit per signed-in user, then per IP. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many AI requests. Try again in a minute.'),
  keyGenerator: (req: Request) => {
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    if (userId) return `user:${userId}`;
    return ipKeyGenerator(req.ip || '');
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many login attempts. Try again in 15 minutes.'),
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many signup attempts. Try again in an hour.'),
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many attempts. Try again in 10 minutes.'),
});

/** Caps webhook floods even if a secret leaks. */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many webhook requests. Try again in a minute.'),
});
