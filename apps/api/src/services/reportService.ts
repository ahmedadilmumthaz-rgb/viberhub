import { db } from '../db/store.js';
import {
  CampaignStatus,
  CampaignItemStatus,
  ConsentStatus,
  DestinationType
} from '@viberhub/shared';

export class ReportService {
  static async getOverviewMetrics(workspaceId: string) {
    const contacts = Array.from(db.data.contacts.values()).filter(
      (c) => c.workspaceId === workspaceId && !c.archivedAt
    );

    const destinations = Array.from(db.data.destinations.values()).filter(
      (d) => d.workspaceId === workspaceId
    );

    const campaigns = Array.from(db.data.campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId && !c.archivedAt
    );

    const items = Array.from(db.data.campaignItems.values()).filter(
      (i) => i.workspaceId === workspaceId
    );

    const attachments = Array.from(db.data.attachments.values()).filter(
      (a) => a.workspaceId === workspaceId
    );

    // Counts by campaign status
    const campaignsByStatus = {
      [CampaignStatus.DRAFT]: campaigns.filter((c) => c.status === CampaignStatus.DRAFT).length,
      [CampaignStatus.IN_REVIEW]: campaigns.filter((c) => c.status === CampaignStatus.IN_REVIEW).length,
      [CampaignStatus.APPROVED]: campaigns.filter((c) => c.status === CampaignStatus.APPROVED).length,
      [CampaignStatus.ARCHIVED]: campaigns.filter((c) => c.status === CampaignStatus.ARCHIVED).length
    };

    // Destinations by type
    const destinationsByType = {
      [DestinationType.INDIVIDUAL]: destinations.filter((d) => d.type === DestinationType.INDIVIDUAL).length,
      [DestinationType.GROUP]: destinations.filter((d) => d.type === DestinationType.GROUP).length,
      [DestinationType.COMMUNITY]: destinations.filter((d) => d.type === DestinationType.COMMUNITY).length,
      [DestinationType.CHANNEL]: destinations.filter((d) => d.type === DestinationType.CHANNEL).length
    };

    // Items awaiting manual action: items in APPROVED campaigns with PREPARED status
    const approvedCampaignIds = new Set(
      campaigns.filter((c) => c.status === CampaignStatus.APPROVED).map((c) => c.id)
    );

    const itemsAwaitingAction = items.filter(
      (i) => approvedCampaignIds.has(i.campaignId) && i.status !== CampaignItemStatus.COMPLETED_MANUALLY && i.status !== CampaignItemStatus.CANCELLED
    ).length;

    // Completed manually count
    const completedManuallyCount = items.filter(
      (i) => i.status === CampaignItemStatus.COMPLETED_MANUALLY
    ).length;

    // Consent breakdown
    const consentCounts: Record<ConsentStatus, number> = {
      [ConsentStatus.GRANTED]: 0,
      [ConsentStatus.WITHDRAWN]: 0,
      [ConsentStatus.UNKNOWN]: 0
    };

    for (const c of contacts) {
      const records = Array.from(db.data.consentRecords.values())
        .filter((cr) => cr.contactId === c.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      const status = (records.length > 0 ? records[0].status : ConsentStatus.UNKNOWN) as ConsentStatus;
      consentCounts[status] = (consentCounts[status] || 0) + 1;
    }

    const totalStorageBytes = attachments.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);

    return {
      totalContacts: contacts.length,
      totalDestinations: destinations.length,
      draftsAwaitingReview: campaignsByStatus[CampaignStatus.IN_REVIEW],
      approvedItemsAwaitingManualAction: itemsAwaitingAction,
      itemsCompletedManually: completedManuallyCount,
      totalStorageBytes,
      campaignsByStatus,
      destinationsByType,
      consentBreakdown: consentCounts,
      dataSourceNote: 'Viber Hub records operator-confirmed preparation and manual completion actions only.'
    };
  }

  static async getCampaignReport(workspaceId: string) {
    const campaigns = Array.from(db.data.campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId
    );

    return campaigns.map((c) => {
      const items = Array.from(db.data.campaignItems.values()).filter((i) => i.campaignId === c.id);
      const completed = items.filter((i) => i.status === CampaignItemStatus.COMPLETED_MANUALLY).length;

      return {
        id: c.id,
        title: c.title,
        status: c.status,
        totalItems: items.length,
        completedManually: completed,
        plannedAt: c.plannedAt,
        createdAt: c.createdAt
      };
    });
  }
}
