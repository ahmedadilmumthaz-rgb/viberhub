import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthService } from '../src/services/authService.js';
import { ContactService } from '../src/services/contactService.js';
import { TemplateService } from '../src/services/templateService.js';
import { DestinationService } from '../src/services/destinationService.js';
import { CampaignService } from '../src/services/campaignService.js';
import { ReportService } from '../src/services/reportService.js';
import { db } from '../src/db/store.js';
import {
  ConsentStatus,
  DestinationType,
  ApprovalDecision,
  CampaignStatus,
  CampaignItemStatus
} from '@viberhub/shared';

describe('Viber Hub End-to-End Workflow', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;
  let contactId: string;
  let templateId: string;
  let destinationId: string;
  let campaignId: string;
  let campaignItemId: string;

  it('1. Authenticates system administrator and initializes workspace context', async () => {
    const authResult = await AuthService.login('admin@viberhub.local', 'Admin1234!');
    assert.ok(authResult.token);
    assert.strictEqual(authResult.user.email, 'admin@viberhub.local');
    assert.ok(authResult.workspaces.length > 0);

    token = authResult.token;
    userId = authResult.user.id;
    workspaceId = authResult.workspaces[0].id;
  });

  it('2. Creates a new contact with automatic E.164 phone normalization', async () => {
    const contact = await ContactService.createContact(workspaceId, userId, {
      displayName: 'E2E Test Stakeholder',
      phoneOriginal: '+33 6 12 34 56 78',
      email: 'stakeholder@e2e-paris.fr',
      organization: 'E2E Paris Corp',
      notes: 'Created via automated E2E test',
      consentStatus: ConsentStatus.GRANTED,
      consentPurpose: 'Quarterly partner updates'
    });

    assert.strictEqual(contact.displayName, 'E2E Test Stakeholder');
    assert.strictEqual(contact.phoneE164, '+33612345678');
    assert.strictEqual(contact.latestConsent?.status, ConsentStatus.GRANTED);
    contactId = contact.id;
  });

  it('3. Creates and previews a message template with safe variables', async () => {
    const template = await TemplateService.createTemplate(workspaceId, userId, {
      name: 'E2E Notice Template',
      category: 'announcement',
      body: 'Hello {{name}} from {{company}}! Planned date: {{date}}.'
    });

    assert.strictEqual(template.name, 'E2E Notice Template');
    templateId = template.id;

    // Test preview interpolation against the created contact
    const preview = await TemplateService.previewTemplate(
      workspaceId,
      template.body,
      contactId
    );

    assert.strictEqual(preview.renderedText.includes('Hello E2E Test Stakeholder from E2E Paris Corp!'), true);
    assert.strictEqual(preview.missingVariables.length, 0);
  });

  it('4. Creates a destination and draft campaign with prepared items', async () => {
    const destination = await DestinationService.createDestination(workspaceId, {
      type: DestinationType.INDIVIDUAL,
      displayName: 'E2E Direct Conversation',
      contactId: contactId,
      notes: 'Target conversation for E2E handoff test'
    });
    destinationId = destination.id;

    const campaign = await CampaignService.createCampaign(workspaceId, userId, {
      title: 'E2E Product Launch Announcement',
      purpose: 'Verify full lifecycle handoff',
      items: [
        {
          destinationId: destination.id,
          contactId: contactId,
          body: 'Important product announcement for E2E group.'
        }
      ]
    });

    assert.strictEqual(campaign.status, CampaignStatus.DRAFT);
    assert.strictEqual(campaign.items.length, 1);
    campaignId = campaign.id;
    campaignItemId = campaign.items[0].id;
  });

  it('5. Enforces state machine: DRAFT -> IN_REVIEW -> APPROVED -> COMPLETED_MANUALLY', async () => {
    // 5a. Submit for review
    const inReview = await CampaignService.submitForReview(workspaceId, campaignId, userId);
    assert.strictEqual(inReview.status, CampaignStatus.IN_REVIEW);

    // 5b. Designated Reviewer approves
    const approved = await CampaignService.approveOrReject(
      workspaceId,
      campaignId,
      userId,
      ApprovalDecision.APPROVED,
      'Approved for operator handoff'
    );
    assert.strictEqual(approved.status, CampaignStatus.APPROVED);

    // 5c. Operator copies content and marks item completed manually in Viber
    const completedItem = await CampaignService.markItemCompleted(
      workspaceId,
      campaignId,
      campaignItemId,
      userId,
      'Pasted and sent manually via Viber Desktop'
    );
    assert.strictEqual(completedItem.status, CampaignItemStatus.COMPLETED_MANUALLY);
    assert.strictEqual(completedItem.completedBy, userId);
    assert.ok(completedItem.completedAt);
  });

  it('6. Overview reports and immutable audit log reflect operations accurately', async () => {
    const metrics = await ReportService.getOverviewMetrics(workspaceId);
    assert.ok(metrics.totalContacts >= 1);
    assert.ok(metrics.itemsCompletedManually >= 1);
    assert.ok(metrics.campaignsByStatus[CampaignStatus.APPROVED] >= 1);

    // Verify audit logs exist
    const logs = Array.from(db.data.auditLogs.values()).filter(
      (l) => l.workspaceId === workspaceId
    );
    assert.ok(logs.length > 0);
  });
});
