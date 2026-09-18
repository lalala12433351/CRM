import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    isAdmin?: boolean;
    companyName?: string;
    tenantId?: string;
    managerId?: string;
  };
  tenantId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1].trim() : '';

  if (token) {
    const sessionUser = authService.getSession(token);
    if (sessionUser) {
      req.user = {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
        name: sessionUser.name,
        isAdmin: sessionUser.isAdmin,
        companyName: sessionUser.companyName,
        tenantId: sessionUser.tenantId,
        managerId: sessionUser.managerId
      };
      req.tenantId = sessionUser.tenantId || (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 'default_tenant';
      return next();
    }
  }

  // A tenant header scopes anonymous/public requests, but never grants a role.
  const headerTenantId = (req.headers['x-tenant-id'] as string)?.trim();
  if (headerTenantId) {
    req.tenantId = headerTenantId;
    return next();
  }

  // Unauthenticated / default tenant for public endpoints
  req.tenantId = process.env.DEFAULT_TENANT_ID || 'default_tenant';
  next();
}
