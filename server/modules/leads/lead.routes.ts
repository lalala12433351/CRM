import { Router } from 'express';
import { leadController } from './lead.controller';

const router = Router();

router.get('/leads', (req, res) => leadController.getLeads(req, res));
router.get('/field-settings', (req, res) => leadController.getFieldSettings(req, res));
router.post('/field-settings', (req, res) => leadController.saveFieldSettings(req, res));

export default router;
