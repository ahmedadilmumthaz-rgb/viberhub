import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import {
  CampaignStatus,
  CampaignItemStatus,
  ApprovalDecision,
  ConsentStatus
} from '@viberhub/shared';

export class CampaignService {
  static async listCampaigns(workspaceId: string, status?: CampaignStatus) {
    let campaigns = Array.from(db.data.campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId && !c.archivedAt
    );

    if (status) {
      campaigns = campaigns.filter((c) => c.status === status);
    }

    const enriched = campaigns.map((c) => {
      const owner = db.data.users.get(c.ownerId);
      const items = Array.from(db.data.campaignItems.values()).filter(
        (ci) => ci.campaignId === c.id
      );

      return {
        ...c,
        ownerName: owner?.displayName || 'Unknown',
        itemCount: items.length
      };
    });

    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return enriched;
  }

  static async getCampaignById(workspaceId: string, id: string) {
    const campaign = db.data.campaigns.get(id);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const owner = db.data.users.get(campaign.ownerId);

    // Get campaign items with destination and attachments
    const rawItems = Array.from(db.data.campaignItems.values()).filter(
      (ci) => ci.campaignId === campaign.id
    );

    const items = rawItems.map((ci) => {
      const destination = db.data.destinations.get(ci.destinationId);
      const contact = ci.contactId ? db.data.contacts.get(ci.contactId) : null;

      const attachmentIds = Array.from(db.data.campaignAttachments.values())
        .filter((ca) => ca.campaignItemId === ci.id)
        .map((ca) => ca.attachmentId);

      const attachments = attachmentIds
        .map((aId) => db.data.attachments.get(aId))
        .filter(Boolean)
        .map((a) => ({
          ...a,
          downloadUrl: `/api/v1/attachments/${a.id}/download`
        }));

      // Get latest consent if contact exists
      let consent = null;
      if (contact) {
        const consents = Array.from(db.data.consentRecords.values())
          .filter((cr) => cr.contactId === contact.id)
          .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        consent = consents[0] || null;
      }

      return {
        ...ci,
        destination: destination || null,
        contact: contact ? { ...contact, latestConsent: consent } : null,
        attachments
      };
    });

    // Approvals
    const approvals = Array.from(db.data.approvalRecords.values())
      .filter((ar) => ar.campaignId === campaign.id)
      .map((ar) => {
        const reviewer = db.data.users.get(ar.reviewerId);
        return {
          ...ar,
          reviewerName: reviewer?.displayName || 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());

    return {
      ...campaign,
      ownerName: owner?.displayName || 'Unknown',
      items,
      approvals
    };
  }

  static async createCampaign(
    workspaceId: string,
    ownerId: string,
    data: {
      title: string;
      purpose?: string;
      notes?: string | null;
      plannedAt?: string | null;
      items?: Array<{
        destinationId: string;
        contactId?: string | null;
        body: string;
        dueAt?: string | null;
        attachmentIds?: string[];
      }>;
    }
  ) {
    const campaignId = uuidv4();
    const now = new Date().toISOString();

    const campaign = {
      id: campaignId,
      workspaceId,
      title: data.title.trim(),
      purpose: data.purpose ? data.purpose.trim() : '',
      notes: data.notes ? data.notes.trim() : null,
      status: CampaignStatus.DRAFT,
      ownerId,
      plannedAt: data.plannedAt || null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    };

    db.data.campaigns.set(campaignId, campaign);

    // Create items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const itemId = uuidv4();
        const campaignItem = {
          id: itemId,
          workspaceId,
          campaignId,
          destinationId: item.destinationId,
          contactId: item.contactId || null,
          body: item.body,
          status: CampaignItemStatus.PREPARED,
          dueAt: item.dueAt || campaign.plannedAt,
          completionNote: null,
          completedBy: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now
        };
        db.data.campaignItems.set(itemId, campaignItem);

        if (item.attachmentIds) {
          for (const attId of item.attachmentIds) {
            db.data.campaignAttachments.set(`${itemId}_${attId}`, {
              campaignItemId: itemId,
              attachmentId: attId
            });
          }
        }
      }
    }

    return this.getCampaignById(workspaceId, campaignId);
  }

  static async submitForReview(workspaceId: string, campaignId: string, actorId: string) {
    const campaign = db.data.campaigns.get(campaignId);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      const err: any = new Error(`Cannot submit campaign in status ${campaign.status} for review`);
      err.statusCode = 400;
      err.code = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    campaign.status = CampaignStatus.IN_REVIEW;
    campaign.updatedAt = new Date().toISOString();

    return this.getCampaignById(workspaceId, campaignId);
  }

  static async approveOrReject(
    workspaceId: string,
    campaignId: string,
    reviewerId: string,
    decision: ApprovalDecision,
    note?: string | null
  ) {
    const campaign = db.data.campaigns.get(campaignId);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (campaign.status !== CampaignStatus.IN_REVIEW) {
      const err: any = new Error(`Only campaigns IN_REVIEW can be approved or returned for changes. Current: ${campaign.status}`);
      err.statusCode = 400;
      err.code = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    const now = new Date().toISOString();

    if (decision === ApprovalDecision.APPROVED) {
      campaign.status = CampaignStatus.APPROVED;
    } else if (decision === ApprovalDecision.CHANGES_REQUESTED) {
      campaign.status = CampaignStatus.DRAFT;
    } else if (decision === ApprovalDecision.REJECTED) {
      campaign.status = CampaignStatus.ARCHIVED;
    }

    campaign.updatedAt = now;

    // Record formal approval audit record
    const approvalId = uuidv4();
    db.data.approvalRecords.set(approvalId, {
      id: approvalId,
      workspaceId,
      campaignId,
      itemId: null,
      reviewerId,
      decision,
      note: note || null,
      decidedAt: now
    });

    return this.getCampaignById(workspaceId, campaignId);
  }

  static async markItemCompleted(
    workspaceId: string,
    campaignId: string,
    itemId: string,
    actorId: string,
    completionNote?: string | null
  ) {
    const campaign = db.data.campaigns.get(campaignId);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (campaign.status !== CampaignStatus.APPROVED) {
      const err: any = new Error(`Only items in APPROVED campaigns can be marked completed manually`);
      err.statusCode = 400;
      err.code = 'CAMPAIGN_NOT_APPROVED';
      throw err;
    }

    const item = db.data.campaignItems.get(itemId);
    if (!item || item.campaignId !== campaignId || item.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign item not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    item.status = CampaignItemStatus.COMPLETED_MANUALLY;
    item.completionNote = completionNote || 'Completed manually by operator in Viber';
    item.completedBy = actorId;
    item.completedAt = now;
    item.updatedAt = now;

    return item;
  }

  static async archiveCampaign(workspaceId: string, campaignId: string) {
    const campaign = db.data.campaigns.get(campaignId);
    if (!campaign || campaign.workspaceId !== workspaceId) {
      const err: any = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    campaign.status = CampaignStatus.ARCHIVED;
    campaign.archivedAt = new Date().toISOString();

    return { success: true, id: campaignId };
  }
}
