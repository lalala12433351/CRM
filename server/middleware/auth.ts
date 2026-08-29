import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  tenantId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // In production, verify JWT token here
    req.user = {
      id: 'default_admin',
      email: 'admin@pixbecrm.com',
      role: 'Admin',
      name: 'Madhava sai nagendra'
    };
  } else {
    // Default fallback admin user for local / session compatibility
    req.user = {
      id: 'default_admin',
      email: 'admin@pixbecrm.com',
      role: 'Admin',
      name: 'Madhava sai nagendra'
    };
  }
  next();
}
