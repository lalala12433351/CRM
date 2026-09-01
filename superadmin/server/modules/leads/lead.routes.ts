import { Router } from 'express';
import { leadController } from './lead.controller';

const router = Router();

router.get('/leads', (req, res) => leadController.getLeads(req, res));
router.post('/leads', (req, res) => leadController.saveLead(req, res));
router.put('/leads/:id', (req, res) => {
  req.body.id = req.params.id;
  return leadController.saveLead(req, res);
});
router.delete('/leads/:id', (req, res) => leadController.deleteLead(req, res));
router.get('/field-settings', (req, res) => leadController.getFieldSettings(req, res));
router.post('/field-settings', (req, res) => leadController.saveFieldSettings(req, res));

export default router;
