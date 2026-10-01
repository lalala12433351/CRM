import { Request, Response, NextFunction } from 'express';
import { multiTenantDb } from '../services/multiTenantDb';
import { logger } from '../utils/logger';

export function requireApiToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const apiKeyHeader = req.headers['x-api-key'];

    let token = '';
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7);
    } else if (apiKeyHeader) {
      token = apiKeyHeader as string;
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing API token' });
    }

    const found = multiTenantDb.findTenantByApiToken(token);
    if (!found) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or revoked API token' });
    }

    // Attach tenantId and token config to the request
    (req as any).tenantId = found.tenantId;
    (req as any).apiTokenConfig = found.token;

    // Update last used asynchronously
    multiTenantDb.updateApiTokenLastUsed(found.tenantId, token);

    next();
  } catch (err) {
    logger.error('API Token Auth Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
}
