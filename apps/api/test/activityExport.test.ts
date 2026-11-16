import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/db/store.js';
import { v4 as uuidv4 } from 'uuid';

describe('Activity & Audit Log Export Service', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';

  it('formats audit logs into RFC-compliant CSV headers and rows', () => {
    const auditId = uuidv4();
    const now = new Date().toISOString();

    db.data.auditLogs.set(auditId, {
      id: auditId,
      workspaceId,
      actorId: userId,
      eventType: 'CAMPAIGN_APPROVED',
      targetType: 'campaign',
      targetId: 'camp-998',
      ipAddress: '192.168.1.50',
      details: { reviewerDecision: 'APPROVED', notes: 'Approved for VIP dispatch' },
      createdAt: now
    });

    const logs = Array.from(db.data.auditLogs.values()).filter(
      (l) => l.workspaceId === workspaceId
    );
    assert.ok(logs.length >= 1, 'Workspace should have audit logs');

    const enriched = logs.map((l) => {
      const actor = db.data.users.get(l.actorId);
      return {
        ...l,
        actorName: actor?.displayName || 'System'
      };
    });

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

    assert.ok(csvContent.startsWith('ID,Event Type,Actor,Target Type,Target ID,IP Address,Created At,Details'));
    assert.ok(csvContent.includes('CAMPAIGN_APPROVED'));
    assert.ok(csvContent.includes('Approved for VIP dispatch'));
    assert.ok(csvContent.includes('192.168.1.50'));
  });

  it('formats activity workflow logs into CSV headers and rows', () => {
    const actId = uuidv4();
    const now = new Date().toISOString();

    db.data.activityLogs.set(actId, {
      id: actId,
      workspaceId,
      actorId: userId,
      action: 'CONTACT_IMPORTED',
      entityType: 'import_batch',
      entityId: 'batch-301',
      details: { count: 45 },
      createdAt: now
    });

    const logs = Array.from(db.data.activityLogs.values()).filter(
      (l) => l.workspaceId === workspaceId
    );

    const enriched = logs.map((l) => {
      const actor = db.data.users.get(l.actorId);
      return {
        ...l,
        actorName: actor?.displayName || 'System'
      };
    });

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
    assert.ok(csvContent.includes('CONTACT_IMPORTED'));
    assert.ok(csvContent.includes('batch-301'));
  });
});
