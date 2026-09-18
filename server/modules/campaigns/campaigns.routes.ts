import { Router } from 'express';
import { campaignsController } from './campaigns.controller';
import { requireAdmin, requireManager } from '../../middleware/rbac';

const router = Router();

// GET /api/campaigns - Admin + Manager only (telecallers blocked)
router.get(['/campaigns', '/workspace/campaigns'], requireManager, (req, res) => campaignsController.getCampaigns(req, res));

// POST /api/campaigns - Create or update a workspace campaign
router.post(['/campaigns', '/workspace/campaigns'], requireAdmin, (req, res) => campaignsController.saveCampaign(req, res));

// DELETE /api/campaigns/:id - Delete a campaign
router.delete(['/campaigns/:id', '/workspace/campaigns/:id'], requireAdmin, (req, res) => campaignsController.deleteCampaign(req, res));

export default router;
