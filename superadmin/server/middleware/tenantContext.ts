import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function tenantContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tenantId = 
    req.user?.tenantId ||
    (req.headers['x-tenant-id'] as string)?.trim() ||
    (req.query.tenantId as string)?.trim() ||
    process.env.DEFAULT_TENANT_ID?.trim() ||
    'default_tenant';

  req.tenantId = tenantId;
  next();
}
