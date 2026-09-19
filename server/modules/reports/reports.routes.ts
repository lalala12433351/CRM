import { Router } from 'express';
import { requireManager } from '../../middleware/rbac';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/reports/call-logs', requireManager, (req, res) => reportsController.getCallLogs(req, res));

export default router;
