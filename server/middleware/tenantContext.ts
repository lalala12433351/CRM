import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function tenantContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extract tenantId from headers, query, session, or default
  const tenantId = 
    (req.headers['x-tenant-id'] as string) ||
    (req.query.tenantId as string) ||
    req.user?.id ||
    'default_admin';

  req.tenantId = tenantId;
  next();
}
