import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { successEnvelope } from '@viberhub/shared';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const type = (req.query.type as string) || 'activity'; // 'activity' or 'audit'

  if (type === 'audit') {
    const logs = Array.from(db.data.auditLogs.values()).filter(
      (l) => l.workspaceId === req.workspaceId
    );

    const enriched = logs.map((l) => {
      const actor = db.data.users.get(l.actorId);
      return {
        ...l,
        actorName: actor?.displayName || 'System'
      };
    });

    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(successEnvelope(enriched));
  }

  // Activity logs
  const logs = Array.from(db.data.activityLogs.values()).filter(
    (l) => l.workspaceId === req.workspaceId
  );

  const enriched = logs.map((l) => {
    const actor = db.data.users.get(l.actorId);
    return {
      ...l,
      actorName: actor?.displayName || 'System'
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(successEnvelope(enriched));
});

router.get('/export', (req: AuthenticatedRequest, res: Response) => {
  const type = (req.query.type as string) || 'audit';
  const logs = type === 'audit'
    ? Array.from(db.data.auditLogs.values()).filter((l) => l.workspaceId === req.workspaceId)
    : Array.from(db.data.activityLogs.values()).filter((l) => l.workspaceId === req.workspaceId);

  const enriched = logs.map((l) => {
    const actor = db.data.users.get(l.actorId);
    return {
      ...l,
      actorName: actor?.displayName || 'System'
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const headers = ['ID', 'Event Type', 'Actor', 'Target Type', 'Target ID', 'IP Address', 'Created At', 'Details'];
  const rows = enriched.map((l) => [
    `"${l.id}"`,
    `"${l.action || l.eventType || ''}"`,
    `"${l.actorName || ''}"`,
    `"${l.entityType || l.targetType || ''}"`,
    `"${l.entityId || l.targetId || ''}"`,
    `"${l.ipAddress || '127.0.0.1'}"`,
    `"${l.createdAt}"`,
    `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="viberhub_${type}_logs_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
});

router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const act = db.data.activityLogs.get(req.params.id);
  const aud = db.data.auditLogs.get(req.params.id);
  const found = act || aud;

  if (!found || found.workspaceId !== req.workspaceId) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Log record not found' }
    });
  }

  const actor = db.data.users.get(found.actorId);
  return res.json(successEnvelope({
    ...found,
    actorName: actor?.displayName || 'System'
  }));
});

export const activityRoutes = router;
