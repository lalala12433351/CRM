import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { multiTenantDb, TenantCall } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { requireAuthenticated } from '../../middleware/rbac';
import { getAccessScope } from '../../utils/accessScope';
import { filterCallsForScope } from '../reports/reports.service';
import {
  ALLOWED_RECORDING_EXTENSIONS,
  contentTypeFor,
  extensionFor,
  localRecordingPath,
  presignedRecordingUrl,
  recordingKey,
  saveRecording
} from '../../services/recordingStorage';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = extensionFor(file.mimetype, file.originalname);
    const ok = file.mimetype.startsWith('audio/') || ALLOWED_RECORDING_EXTENSIONS.has(ext);
    cb(null, ok);
  }
});

const LINK_SECRET = process.env.RECORDING_LINK_SECRET || crypto.randomBytes(32).toString('hex');

function tenantIdOf(req: Request): string {
  return (
    (req as AuthenticatedRequest).tenantId ||
    (req.headers['x-tenant-id'] as string) ||
    (req as any).body?.tenantId ||
    process.env.DEFAULT_TENANT_ID ||
    'default_tenant'
  );
}

/** Recording storage fields are server-owned; never accept them from clients. */
function stripServerFields(body: any): any {
  const { recordingKey: _k, recordingStatus: _s, ...rest } = body || {};
  return rest;
}

function createCallData(body: any): any {
  const data = stripServerFields(body);
  const status = body?.recordingStatus;
  if (status === 'pending' || status === 'not_found' || status === 'disabled') {
    data.recordingStatus = status;
  }
  return data;
}

function keyBelongsToTenant(key: string | undefined, tenantId: string): key is string {
  if (!key) return false;
  return key.startsWith(`recordings/${String(tenantId).replace(/[^a-zA-Z0-9._-]/g, '_')}/`);
}

async function findVisibleCall(req: Request, callId: string): Promise<TenantCall | null> {
  const tenantId = tenantIdOf(req);
  const call = await multiTenantDb.getCall(tenantId, callId);
  if (!call) return null;
  const agents = await multiTenantDb.getAgents(tenantId);
  const scope = await getAccessScope(req as AuthenticatedRequest);
  return filterCallsForScope([call], agents, scope).length ? call : null;
}

function signLocalLink(tenantId: string, callId: string, exp: number): string {
  return crypto.createHmac('sha256', LINK_SECRET).update(`${tenantId}:${callId}:${exp}`).digest('hex');
}

// GET /api/calls - Role-scoped call records for the current tenant
router.get('/calls', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = tenantIdOf(req);
    const [calls, agents] = await Promise.all([
      multiTenantDb.getCalls(tenantId),
      multiTenantDb.getAgents(tenantId)
    ]);
    const scope = await getAccessScope(authReq);
    const visible = filterCallsForScope(calls, agents, scope);
    res.json({ success: true, tenantId, calls: visible });
  } catch (err: any) {
    logger.error('Error fetching calls:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls - Log new call record for current tenant
router.post('/calls', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const callData = { ...createCallData(req.body), tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    
    // Trigger active workflows for Call Log
    try {
      const { workflowEngine } = await import('../../services/workflowEngine');
      const leads = await multiTenantDb.getLeads(tenantId, [], true);
      const matchedLead = leads.find((l) => l.id === callData.leadId || l.phone === callData.phoneNumber || l.name === callData.leadName);
      await workflowEngine.triggerWorkflowsForEvent(tenantId, 'call_logged', { call: saved, lead: matchedLead });
    } catch (wfErr: any) {
      logger.warn('[Calls Route] Workflow trigger notice:', wfErr?.message);
    }

    res.status(201).json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error creating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/calls/:id - Update call record
router.put('/calls/:id', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const callData = { ...stripServerFields(req.body), id: req.params.id, tenantId };
    const saved = await multiTenantDb.saveCall(tenantId, callData);
    res.json({ success: true, tenantId, call: saved });
  } catch (err: any) {
    logger.error('Error updating call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/:id/recording - Upload the audio file captured by the phone's call recorder
router.post(
  '/calls/:id/recording',
  requireAuthenticated,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const tenantId = tenantIdOf(req);
      const call = await findVisibleCall(req, req.params.id);
      // 404 lets the mobile upload worker retry until the call record has been saved.
      if (!call) return res.status(404).json({ success: false, error: 'Call not found' });

      const settings = await multiTenantDb.getWorkspaceSettings(tenantId);
      if (settings?.general?.autoRecordCalls === false) {
        await multiTenantDb.saveCall(tenantId, { id: call.id, recordingStatus: 'disabled' });
        return res.status(409).json({ success: false, error: 'Call recording is disabled for this workspace' });
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ success: false, error: 'Audio file is required (field "file")' });

      const ext = extensionFor(file.mimetype, file.originalname);
      const key = recordingKey(tenantId, call.id, ext);
      await saveRecording(key, file.buffer, contentTypeFor(ext));

      const saved = await multiTenantDb.saveCall(tenantId, {
        id: call.id,
        recordingKey: key,
        recordingStatus: 'uploaded',
        recordingUrl: `/api/calls/${encodeURIComponent(call.id)}/recording`
      });
      res.json({ success: true, call: saved });
    } catch (err: any) {
      logger.error('Error uploading call recording:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/calls/:id/recording-status - Mobile app reports the upload lifecycle
router.post('/calls/:id/recording-status', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const call = await findVisibleCall(req, req.params.id);
    if (!call) return res.status(404).json({ success: false, error: 'Call not found' });
    const requestedStatus = req.body?.status;
    const allowedStatuses: TenantCall['recordingStatus'][] = ['pending', 'not_found', 'failed', 'disabled'];
    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid recording status' });
    }
    const status = requestedStatus as TenantCall['recordingStatus'];
    if (call.recordingStatus === 'uploaded') return res.json({ success: true, call });
    const saved = await multiTenantDb.saveCall(tenantId, { id: call.id, recordingStatus: status });
    res.json({ success: true, call: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/:id/recording - Returns a short-lived playback URL
router.get('/calls/:id/recording', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const call = await findVisibleCall(req, req.params.id);
    if (!call || !keyBelongsToTenant(call.recordingKey, tenantId)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }

    const presigned = await presignedRecordingUrl(call.recordingKey);
    if (presigned) return res.json({ success: true, url: presigned, expiresIn: 600 });

    const exp = Date.now() + 10 * 60 * 1000;
    const sig = signLocalLink(tenantId, call.id, exp);
    const qs = new URLSearchParams({ t: tenantId, exp: String(exp), sig });
    res.json({
      success: true,
      url: `/api/calls/${encodeURIComponent(call.id)}/recording/file?${qs.toString()}`,
      expiresIn: 600
    });
  } catch (err: any) {
    logger.error('Error resolving call recording:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/:id/recording/file - Local-disk playback via signed link (dev / non-S3 deployments)
router.get('/calls/:id/recording/file', async (req: Request, res: Response) => {
  const tenantId = String(req.query.t || '');
  const exp = Number(req.query.exp || 0);
  const sig = String(req.query.sig || '');
  const expected = signLocalLink(tenantId, req.params.id, exp);
  const valid =
    exp > Date.now() &&
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!valid) return res.status(403).json({ success: false, error: 'Link expired or invalid' });

  const call = await multiTenantDb.getCall(tenantId, req.params.id);
  if (!call || !keyBelongsToTenant(call.recordingKey, tenantId)) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }
  const filePath = localRecordingPath(call.recordingKey);
  if (!filePath) return res.status(404).json({ success: false, error: 'Recording file missing' });
  res.sendFile(filePath);
});

// DELETE /api/calls/:id - Delete call record
router.delete('/calls/:id', requireAuthenticated, async (req: Request, res: Response) => {
  try {
    const tenantId = tenantIdOf(req);
    const success = await multiTenantDb.deleteCall(tenantId, req.params.id);
    res.json({ success, message: success ? 'Call record deleted' : 'Call record not found' });
  } catch (err: any) {
    logger.error('Error deleting call:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
