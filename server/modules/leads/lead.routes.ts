import { Router } from 'express';
import { leadController } from './lead.controller';
import { requireAdmin, requireAuthenticated } from '../../middleware/rbac';

const router = Router();

router.get('/leads', requireAuthenticated, (req, res) => leadController.getLeads(req, res));
router.post('/leads', requireAuthenticated, (req, res) => leadController.saveLead(req, res));
router.put('/leads/:id', requireAuthenticated, (req, res) => {
  req.body.id = req.params.id;
  return leadController.saveLead(req, res);
});
router.delete('/leads/:id', requireAuthenticated, (req, res) => leadController.deleteLead(req, res));
router.get('/field-settings', requireAuthenticated, (req, res) => leadController.getFieldSettings(req, res));
router.post('/field-settings', requireAdmin, (req, res) => leadController.saveFieldSettings(req, res));
router.get('/activities', requireAuthenticated, (req, res) => leadController.getActivities(req, res));
router.post('/activities', requireAuthenticated, (req, res) => leadController.logActivity(req, res));
router.delete('/activities/:id', requireAuthenticated, (req, res) => leadController.deleteActivity(req, res));

export default router;
