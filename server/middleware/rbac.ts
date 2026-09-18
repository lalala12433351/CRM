import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../services/multiTenantDb';

export const requireAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized: Sign in required' });
  next();
};

export const requireRole = (allowedRoles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Sign in required' });
    const userRole = (req.user.role || 'Telecaller').toLowerCase();
    const allowed = allowedRoles.map((role) => String(role).toLowerCase());

    // Admins bypass all role restrictions
    if (req.user?.isAdmin || userRole === 'admin' || userRole.includes('admin') || userRole.includes('owner')) {
      return next();
    }

    if (allowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
  };
};

export const requireAdmin = requireRole(['Admin']);
export const requireManager = requireRole(['Admin', 'Manager']);
