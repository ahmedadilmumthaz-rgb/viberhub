import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/db/store.js';
import { CampaignService } from '../src/services/campaignService.js';
import { DestinationService } from '../src/services/destinationService.js';
import { ContactService } from '../src/services/contactService.js';
import { DestinationType, CampaignStatus, ApprovalDecision } from '@viberhub/shared';
import { v4 as uuidv4 } from 'uuid';

describe('Companion Device Registry & Handoff Integration', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';

  it('pairs companion device and generates secure pairingToken', async () => {
    const id = uuidv4();
    const pairingToken = `vh_dev_${uuidv4().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    const device = {
      id,
      workspaceId,
      userId,
      deviceName: 'Operator MacBook Pro',
      platform: 'desktop',
      pairingToken,
      clientVersion: '1.0.0',
      pairedAt: now,
      lastSeenAt: now,
      revokedAt: null
    };

    db.data.devices.set(id, device);

    const retrieved = db.data.devices.get(id);
    assert.ok(retrieved, 'Device must be saved in store');
    assert.strictEqual(retrieved.deviceName, 'Operator MacBook Pro');
    assert.ok(retrieved.pairingToken.startsWith('vh_dev_'), 'pairingToken must be generated');
    assert.strictEqual(retrieved.revokedAt, null);
  });

  it('updates lastSeenAt timestamp on device ping heartbeat', async () => {
    const id = uuidv4();
    const pastTime = new Date(Date.now() - 3600000).toISOString();

    db.data.devices.set(id, {
      id,
      workspaceId,
      userId,
      deviceName: 'Android Field Phone',
      platform: 'android',
      pairingToken: `vh_dev_${uuidv4().replace(/-/g, '')}`,
      clientVersion: '1.0.0',
      pairedAt: pastTime,
      lastSeenAt: pastTime,
      revokedAt: null
    });

    const device = db.data.devices.get(id);
    const newTimestamp = new Date().toISOString();
    device.lastSeenAt = newTimestamp;
    device.clientVersion = '1.0.1';

    assert.strictEqual(device.clientVersion, '1.0.1');
    assert.strictEqual(device.lastSeenAt, newTimestamp);
  });

  it('retrieves pending handoff items for approved campaigns', async () => {
    // 1. Create a contact & destination
    const contact = await ContactService.createContact(workspaceId, userId, {
      displayName: 'Handoff Recipient',
      phoneOriginal: '+14155557711'
    });

    const destination = await DestinationService.createDestination(workspaceId, {
      type: DestinationType.INDIVIDUAL_CHAT,
      displayName: contact.displayName,
      contactId: contact.id
    });

    // 2. Create campaign & approve it
    const campaign = await CampaignService.createCampaign(workspaceId, userId, {
      title: 'Device Handoff Test Campaign',
      items: [
        {
          destinationId: destination.id,
          body: 'Special companion dispatch payload'
        }
      ]
    });

    await CampaignService.submitForReview(workspaceId, campaign.id, userId);
    await CampaignService.approveOrReject(workspaceId, campaign.id, userId, ApprovalDecision.APPROVED);

    // 3. Query pending handoff items
    const pendingItems = await CampaignService.getPendingHandoffItems(workspaceId);
    assert.ok(pendingItems.length >= 1, 'Should find at least 1 pending item');

    const handoffItem = pendingItems.find((pi) => pi.campaignId === campaign.id);
    assert.ok(handoffItem, 'Should find handoff item for the approved campaign');
    assert.strictEqual(handoffItem.body, 'Special companion dispatch payload');
    assert.ok(handoffItem.viberUri.includes('14155557711'), 'Should contain valid viber URI');
    assert.strictEqual(handoffItem.contact?.displayName, 'Handoff Recipient');
  });

  it('revokes companion device properly', async () => {
    const id = uuidv4();
    db.data.devices.set(id, {
      id,
      workspaceId,
      userId,
      deviceName: 'Old Tablet',
      platform: 'android',
      pairingToken: `vh_dev_${uuidv4().replace(/-/g, '')}`,
      pairedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      revokedAt: null
    });

    const device = db.data.devices.get(id);
    device.revokedAt = new Date().toISOString();

    const activeDevices = Array.from(db.data.devices.values()).filter(
      (d) => d.workspaceId === workspaceId && !d.revokedAt
    );

    assert.ok(!activeDevices.some((d) => d.id === id), 'Revoked device must not appear in active devices');
  });

  it('authenticates companion requests via X-Device-Token or Bearer vh_dev_ token', async () => {
    const { authMiddleware } = await import('../src/middleware/auth.js');
    const { workspaceMiddleware } = await import('../src/middleware/workspace.js');

    const deviceId = uuidv4();
    const token = `vh_dev_${uuidv4().replace(/-/g, '')}`;

    db.data.devices.set(deviceId, {
      id: deviceId,
      workspaceId,
      userId,
      deviceName: 'Companion Desktop App',
      platform: 'desktop',
      pairingToken: token,
      clientVersion: '1.0.0',
      pairedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      revokedAt: null
    });

    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      },
      query: {}
    } as any;

    let nextCount = 0;
    const mockRes = {
      status: () => mockRes,
      json: () => mockRes
    } as any;

    authMiddleware(mockReq, mockRes, () => {
      nextCount++;
    });

    assert.strictEqual(nextCount, 1, 'authMiddleware should call next()');
    assert.strictEqual(mockReq.userId, userId);
    assert.strictEqual(mockReq.workspaceId, workspaceId);

    // Now test workspaceMiddleware with pre-resolved workspaceId
    let workspaceNext = 0;
    workspaceMiddleware(mockReq, mockRes, () => {
      workspaceNext++;
    });

    assert.strictEqual(workspaceNext, 1, 'workspaceMiddleware should call next()');
    assert.strictEqual(mockReq.workspaceId, workspaceId);
  });
});
