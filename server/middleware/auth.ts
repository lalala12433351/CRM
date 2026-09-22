import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { isCognitoEnabled } from '../auth/cognitoConfig';
import { looksLikeJwt } from '../auth/cognitoJwt';
import { findMembershipsByEmail } from '../db/provisionTenant';
import { logger } from '../utils/logger';

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

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1].trim() : '';
  const headerTenantId = ((req.headers['x-tenant-id'] as string) || '').trim();

  try {
    if (token) {
      if (isCognitoEnabled() && looksLikeJwt(token)) {
        try {
          const user = await authService.resolveUserFromCognitoToken(token, headerTenantId || undefined);
          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              name: user.name,
              isAdmin: user.isAdmin,
              companyName: user.companyName,
              tenantId: user.tenantId,
              managerId: user.managerId
            };
            req.tenantId = user.tenantId;
            return next();
          }
        } catch (err: any) {
          if (String(err?.message || '').startsWith('Forbidden')) {
            return res.status(403).json({ error: err.message });
          }
          logger.warn('[Auth] JWT middleware:', err?.message || err);
        }
      } else {
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

          if (headerTenantId && headerTenantId !== sessionUser.tenantId) {
            if (isCognitoEnabled()) {
              const memberships = await findMembershipsByEmail(sessionUser.email);
              const allowed = memberships.some((m) => m.tenantId === headerTenantId);
              if (!allowed) {
                return res.status(403).json({ error: 'Forbidden: You are not a member of that workspace' });
              }
              req.tenantId = headerTenantId;
            } else {
              req.tenantId = sessionUser.tenantId || headerTenantId;
            }
          } else {
            req.tenantId =
              sessionUser.tenantId || headerTenantId || process.env.DEFAULT_TENANT_ID || 'default_tenant';
          }
          return next();
        }
      }
    }

    // Unauthenticated: do not trust x-tenant-id when Cognito is on.
    if (headerTenantId && !isCognitoEnabled()) {
      req.tenantId = headerTenantId;
      return next();
    }

    req.tenantId = process.env.DEFAULT_TENANT_ID || 'default_tenant';
    next();
  } catch (err: any) {
    logger.error('[Auth] middleware error:', err?.message || err);
    next();
  }
}
