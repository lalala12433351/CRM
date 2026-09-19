import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { getAccessScope } from '../../utils/accessScope';
import { buildCallLogsReport, ReportFilters } from './reports.service';

function tenantIdOf(req: Request): string {
  return (
    (req as AuthenticatedRequest).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

export class ReportsController {
  public async getCallLogs(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = tenantIdOf(req);
      const scope = await getAccessScope(authReq);
      if (scope.role === 'telecaller') {
        return res.status(403).json({ success: false, error: 'Forbidden: Reports are available to managers and admins.' });
      }

      const query = req.query as Record<string, string | undefined>;
      const filters: ReportFilters = {
        userId: query.userId,
        managerId: query.managerId,
        from: query.from,
        to: query.to,
        search: query.search,
        disposition: query.disposition,
        type: query.type,
        sort: (query.sort as ReportFilters['sort']) || 'newest'
      };

      const report = await buildCallLogsReport(tenantId, scope, filters);
      return res.json({ success: true, tenantId, ...report });
    } catch (err: any) {
      logger.error('Error building call logs report:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const reportsController = new ReportsController();
