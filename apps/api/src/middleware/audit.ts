import { AuthenticatedRequest } from './auth.js';
import { db } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';

export function logAuditEvent(
  req: AuthenticatedRequest,
  eventType: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  const workspaceId = req.workspaceId;
  const actorId = req.userId || 'system';

  if (!workspaceId) return;

  const id = uuidv4();
  const now = new Date().toISOString();

  db.data.auditLogs.set(id, {
    id,
    workspaceId,
    actorId,
    eventType,
    targetType,
    targetId,
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: now
  });
}

export function logActivityEvent(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const workspaceId = req.workspaceId;
  const actorId = req.userId || 'system';

  if (!workspaceId) return;

  const id = uuidv4();
  const now = new Date().toISOString();

  db.data.activityLogs.set(id, {
    id,
    workspaceId,
    actorId,
    action,
    entityType,
    entityId,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: now
  });
}
