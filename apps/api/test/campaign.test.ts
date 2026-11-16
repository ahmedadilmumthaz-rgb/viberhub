import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CampaignService } from '../src/services/campaignService.js';
import { CampaignStatus, CampaignItemStatus, ApprovalDecision } from '@viberhub/shared';

describe('Campaign Service & State Machine', () => {
  const testWorkspaceId = '11111111-1111-1111-1111-111111111111';
  const testUserId = '00000000-0000-0000-0000-000000000001';

  it('creates campaign in DRAFT status', async () => {
    const campaign = await CampaignService.createCampaign(testWorkspaceId, testUserId, {
      title: 'Monthly Newsletter Announcement',
      purpose: 'Inform subscribers about platform improvements',
      items: [
        {
          destinationId: 'sample-dest-1',
          body: 'Hello, check our latest news'
        }
      ]
    });

    assert.strictEqual(campaign.status, CampaignStatus.DRAFT);
    assert.strictEqual(campaign.title, 'Monthly Newsletter Announcement');
    assert.strictEqual(campaign.items.length, 1);
    assert.strictEqual(campaign.items[0].status, CampaignItemStatus.PREPARED);
  });

  it('submits DRAFT campaign for review -> IN_REVIEW', async () => {
    const campaign = await CampaignService.createCampaign(testWorkspaceId, testUserId, {
      title: 'Review Submission Test',
      purpose: 'Testing state transitions'
    });

    const submitted = await CampaignService.submitForReview(testWorkspaceId, campaign.id, testUserId);
    assert.strictEqual(submitted.status, CampaignStatus.IN_REVIEW);
  });

  it('rejects invalid state transition directly from DRAFT to APPROVED', async () => {
    const campaign = await CampaignService.createCampaign(testWorkspaceId, testUserId, {
      title: 'Invalid Jump Test'
    });

    await assert.rejects(async () => {
      await CampaignService.approveOrReject(
        testWorkspaceId,
        campaign.id,
        testUserId,
        ApprovalDecision.APPROVED
      );
    }, /Only campaigns IN_REVIEW can be approved/);
  });

  it('allows Reviewer to request changes -> returns to DRAFT', async () => {
    const campaign = await CampaignService.createCampaign(testWorkspaceId, testUserId, {
      title: 'Revision Test'
    });
    await CampaignService.submitForReview(testWorkspaceId, campaign.id, testUserId);

    const returned = await CampaignService.approveOrReject(
      testWorkspaceId,
      campaign.id,
      testUserId,
      ApprovalDecision.CHANGES_REQUESTED,
      'Please fix typo in section 2'
    );

    assert.strictEqual(returned.status, CampaignStatus.DRAFT);
    assert.strictEqual(returned.approvals.length, 1);
    assert.strictEqual(returned.approvals[0].decision, ApprovalDecision.CHANGES_REQUESTED);
    assert.strictEqual(returned.approvals[0].note, 'Please fix typo in section 2');
  });

  it('approves campaign -> APPROVED, and marks item completed manually', async () => {
    const campaign = await CampaignService.createCampaign(testWorkspaceId, testUserId, {
      title: 'Approval and Completion Test',
      items: [
        {
          destinationId: 'sample-dest-2',
          body: 'Special offer content'
        }
      ]
    });

    await CampaignService.submitForReview(testWorkspaceId, campaign.id, testUserId);
    const approved = await CampaignService.approveOrReject(
      testWorkspaceId,
      campaign.id,
      testUserId,
      ApprovalDecision.APPROVED,
      'Approved for operator handoff'
    );

    assert.strictEqual(approved.status, CampaignStatus.APPROVED);

    const itemId = approved.items[0].id;
    const completedItem = await CampaignService.markItemCompleted(
      testWorkspaceId,
      approved.id,
      itemId,
      testUserId,
      'Sent via Viber Desktop on MacBook Pro'
    );

    assert.strictEqual(completedItem.status, CampaignItemStatus.COMPLETED_MANUALLY);
    assert.strictEqual(completedItem.completedBy, testUserId);
    assert.strictEqual(completedItem.completionNote, 'Sent via Viber Desktop on MacBook Pro');
    assert.ok(completedItem.completedAt);
  });
});
