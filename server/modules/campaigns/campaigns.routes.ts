import { Router } from 'express';
import { campaignsController } from './campaigns.controller';

const router = Router();

// GET /api/campaigns - Fetch all workspace campaigns
router.get(['/campaigns', '/workspace/campaigns'], (req, res) => campaignsController.getCampaigns(req, res));

// POST /api/campaigns - Create or update a workspace campaign
router.post(['/campaigns', '/workspace/campaigns'], (req, res) => campaignsController.saveCampaign(req, res));

// DELETE /api/campaigns/:id - Delete a campaign
router.delete(['/campaigns/:id', '/workspace/campaigns/:id'], (req, res) => campaignsController.deleteCampaign(req, res));

export default router;
