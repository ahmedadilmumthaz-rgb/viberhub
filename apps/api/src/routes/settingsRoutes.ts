import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireRole } from '../middleware/rbac.js';
import { viberAccountSchema, deviceRegisterSchema, updateWorkspaceSchema } from '@viberhub/validation';
import { MemberRole, AccountStatus, successEnvelope } from '@viberhub/shared';
import { logAuditEvent } from '../middleware/audit.js';
import { CampaignService } from '../services/campaignService.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

// Workspace settings
router.get('/workspace', (req: AuthenticatedRequest, res: Response) => {
  const ws = db.data.workspaces.get(req.workspaceId!);
  res.json(successEnvelope(ws));
});

router.patch('/workspace', requireRole(MemberRole.ADMINISTRATOR), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = updateWorkspaceSchema.parse(req.body);
    const ws = db.data.workspaces.get(req.workspaceId!);
    if (!ws) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    }

    if (validated.name) ws.name = validated.name.trim();
    if (validated.timezone) ws.timezone = validated.timezone;
    if (validated.locale) ws.locale = validated.locale;
    ws.updatedAt = new Date().toISOString();

    logAuditEvent(req, 'WORKSPACE_SETTINGS_UPDATED', 'workspace', ws.id);
    res.json(successEnvelope(ws));
  } catch (err) {
    next(err);
  }
});

// Organizational Viber Account Profiles (Metadata only, no session credentials)
router.get('/accounts', (req: AuthenticatedRequest, res: Response) => {
  const accounts = Array.from(db.data.viberAccounts.values()).filter(
    (a) => a.workspaceId === req.workspaceId && a.status === AccountStatus.ACTIVE
  );
  res.json(successEnvelope(accounts));
});

router.post('/accounts', requireRole(MemberRole.ADMINISTRATOR), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = viberAccountSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    const account = {
      id,
      workspaceId: req.workspaceId!,
      displayName: validated.displayName.trim(),
      phoneLabel: validated.phoneLabel ? validated.phoneLabel.trim() : null,
      status: AccountStatus.ACTIVE,
      notes: validated.notes ? validated.notes.trim() : null,
      createdAt: now
    };

    db.data.viberAccounts.set(id, account);
    logAuditEvent(req, 'VIBER_ACCOUNT_PROFILE_CREATED', 'viber_account', id);

    res.status(201).json(successEnvelope(account));
  } catch (err) {
    next(err);
  }
});

router.delete('/accounts/:id', requireRole(MemberRole.ADMINISTRATOR), (req: AuthenticatedRequest, res: Response) => {
  const account = db.data.viberAccounts.get(req.params.id);
  if (!account || account.workspaceId !== req.workspaceId) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account profile not found' } });
  }

  account.status = AccountStatus.REVOKED;
  logAuditEvent(req, 'VIBER_ACCOUNT_PROFILE_REVOKED', 'viber_account', account.id);
  res.json(successEnvelope({ success: true, id: account.id }));
});

// Device registry (for companion device pairing, heartbeats, and handoff tasks)
router.get('/devices', (req: AuthenticatedRequest, res: Response) => {
  const devices = Array.from(db.data.devices.values()).filter(
    (d) => d.workspaceId === req.workspaceId && !d.revokedAt
  );
  res.json(successEnvelope(devices));
});

router.get('/devices/pending-handoff', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const items = await CampaignService.getPendingHandoffItems(req.workspaceId!);
    res.json(successEnvelope(items));
  } catch (err) {
    next(err);
  }
});

router.post('/devices', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = deviceRegisterSchema.parse(req.body);
    const id = uuidv4();
    const pairingToken = `vh_dev_${uuidv4().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    const device = {
      id,
      workspaceId: req.workspaceId!,
      userId: req.userId!,
      deviceName: validated.deviceName.trim(),
      platform: validated.platform,
      pairingToken,
      clientVersion: req.body.clientVersion || '1.0.0',
      pairedAt: now,
      lastSeenAt: now,
      revokedAt: null
    };

    db.data.devices.set(id, device);
    logAuditEvent(req, 'DEVICE_PAIRED', 'device', id, { platform: device.platform });

    res.status(201).json(successEnvelope(device));
  } catch (err) {
    next(err);
  }
});

router.post('/devices/:id/ping', (req: AuthenticatedRequest, res: Response) => {
  const device = db.data.devices.get(req.params.id);
  if (!device || device.workspaceId !== req.workspaceId || device.revokedAt) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Device not found or revoked' } });
  }

  const now = new Date().toISOString();
  device.lastSeenAt = now;
  if (req.body.clientVersion) {
    device.clientVersion = req.body.clientVersion;
  }

  res.json(successEnvelope({ success: true, id: device.id, lastSeenAt: now }));
});

router.delete('/devices/:id', (req: AuthenticatedRequest, res: Response) => {
  const device = db.data.devices.get(req.params.id);
  if (!device || device.workspaceId !== req.workspaceId) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Device not found' } });
  }

  device.revokedAt = new Date().toISOString();
  logAuditEvent(req, 'DEVICE_REVOKED', 'device', device.id);

  res.json(successEnvelope({ success: true, id: device.id }));
});

export const settingsRoutes = router;
