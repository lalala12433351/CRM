import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../services/multiTenantDb';

export const requireRole = (allowedRoles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'Telecaller';
    
    // Admins bypass all role restrictions
    if (req.user?.isAdmin || allowedRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
  };
};

export const requireAdmin = requireRole(['Admin']);
export const requireManager = requireRole(['Admin', 'Manager']);
