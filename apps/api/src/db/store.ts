import {
  AccountStatus,
  DestinationType,
  ConsentStatus,
  CampaignStatus,
  CampaignItemStatus,
  ApprovalDecision,
  MemberRole,
  ImportStatus,
  AuthUser,
  WorkspaceSummary,
  ContactDto,
  TagDto,
  ConsentRecordDto,
  DestinationDto,
  MessageTemplateDto,
  AttachmentDto,
  CampaignDto,
  CampaignItemDto,
  ApprovalRecordDto,
  ActivityLogDto,
  AuditLogDto,
  ViberAccountDto,
  DeviceDto
} from '@viberhub/shared';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// In-memory / structured database store for robust local operation & Prisma interoperability
export interface DatabaseStore {
  users: Map<string, any>;
  sessions: Map<string, any>;
  workspaces: Map<string, any>;
  workspaceMembers: Map<string, any>;
  viberAccounts: Map<string, any>;
  devices: Map<string, any>;
  contacts: Map<string, any>;
  tags: Map<string, any>;
  contactTags: Map<string, any>;
  consentRecords: Map<string, any>;
  destinations: Map<string, any>;
  templates: Map<string, any>;
  campaigns: Map<string, any>;
  campaignItems: Map<string, any>;
  attachments: Map<string, any>;
  campaignAttachments: Map<string, any>;
  approvalRecords: Map<string, any>;
  importBatches: Map<string, any>;
  activityLogs: Map<string, any>;
  auditLogs: Map<string, any>;
}

class Store {
  public data: DatabaseStore = {
    users: new Map(),
    sessions: new Map(),
    workspaces: new Map(),
    workspaceMembers: new Map(),
    viberAccounts: new Map(),
    devices: new Map(),
    contacts: new Map(),
    tags: new Map(),
    contactTags: new Map(),
    consentRecords: new Map(),
    destinations: new Map(),
    templates: new Map(),
    campaigns: new Map(),
    campaignItems: new Map(),
    attachments: new Map(),
    campaignAttachments: new Map(),
    approvalRecords: new Map(),
    importBatches: new Map(),
    activityLogs: new Map(),
    auditLogs: new Map()
  };

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Default system admin
    const defaultUserId = '00000000-0000-0000-0000-000000000001';
    const defaultWorkspaceId = '11111111-1111-1111-1111-111111111111';
    const passwordHash = bcrypt.hashSync('Admin1234!', 10);

    const now = new Date().toISOString();

    this.data.users.set(defaultUserId, {
      id: defaultUserId,
      email: 'admin@viberhub.local',
      passwordHash,
      displayName: 'System Admin',
      status: AccountStatus.ACTIVE,
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: now,
      updatedAt: now
    });

    this.data.workspaces.set(defaultWorkspaceId, {
      id: defaultWorkspaceId,
      name: 'Primary Organization',
      timezone: 'UTC',
      locale: 'en',
      createdAt: now,
      updatedAt: now
    });

    const memberId = uuidv4();
    this.data.workspaceMembers.set(memberId, {
      id: memberId,
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      role: MemberRole.OWNER,
      status: AccountStatus.ACTIVE,
      joinedAt: now
    });

    // Sample Viber account profile (label only)
    const viberAccId = uuidv4();
    this.data.viberAccounts.set(viberAccId, {
      id: viberAccId,
      workspaceId: defaultWorkspaceId,
      displayName: 'Corporate Dispatch Line',
      phoneLabel: '+1 (555) 019-2831',
      status: AccountStatus.ACTIVE,
      notes: 'Main registered Viber dispatch number for communications',
      createdAt: now
    });

    // Sample Tags
    const vipTagId = uuidv4();
    const clientTagId = uuidv4();
    const partnerTagId = uuidv4();

    this.data.tags.set(vipTagId, {
      id: vipTagId,
      workspaceId: defaultWorkspaceId,
      name: 'VIP Client',
      color: '#8b5cf6',
      archivedAt: null,
      createdAt: now
    });

    this.data.tags.set(clientTagId, {
      id: clientTagId,
      workspaceId: defaultWorkspaceId,
      name: 'Customer',
      color: '#3b82f6',
      archivedAt: null,
      createdAt: now
    });

    this.data.tags.set(partnerTagId, {
      id: partnerTagId,
      workspaceId: defaultWorkspaceId,
      name: 'Partner',
      color: '#10b981',
      archivedAt: null,
      createdAt: now
    });

    // Sample Contacts
    const c1Id = uuidv4();
    const c2Id = uuidv4();
    const c3Id = uuidv4();

    this.data.contacts.set(c1Id, {
      id: c1Id,
      workspaceId: defaultWorkspaceId,
      displayName: 'Elena Rostova',
      phoneOriginal: '+44 7911 123456',
      phoneE164: '+447911123456',
      email: 'elena@rostova-consulting.com',
      organization: 'Rostova Consulting',
      notes: 'Key account stakeholder for quarterly business updates',
      source: 'manual',
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    this.data.contacts.set(c2Id, {
      id: c2Id,
      workspaceId: defaultWorkspaceId,
      displayName: 'Marcus Vance',
      phoneOriginal: '+1 (415) 555-0199',
      phoneE164: '+14155550199',
      email: 'm.vance@techhorizon.io',
      organization: 'TechHorizon',
      notes: 'Requested product release briefings',
      source: 'manual',
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    this.data.contacts.set(c3Id, {
      id: c3Id,
      workspaceId: defaultWorkspaceId,
      displayName: 'Sarah Jenkins',
      phoneOriginal: '+61 491 570 156',
      phoneE164: '+61491570156',
      email: 'sarah.j@apexsolutions.com.au',
      organization: 'Apex Solutions',
      notes: 'VIP customer contact',
      source: 'import',
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    // Tag assignments
    this.data.contactTags.set(`${c1Id}_${vipTagId}`, { contactId: c1Id, tagId: vipTagId });
    this.data.contactTags.set(`${c1Id}_${clientTagId}`, { contactId: c1Id, tagId: clientTagId });
    this.data.contactTags.set(`${c2Id}_${clientTagId}`, { contactId: c2Id, tagId: clientTagId });
    this.data.contactTags.set(`${c3Id}_${vipTagId}`, { contactId: c3Id, tagId: vipTagId });
    this.data.contactTags.set(`${c3Id}_${partnerTagId}`, { contactId: c3Id, tagId: partnerTagId });

    // Consent records
    this.data.consentRecords.set(uuidv4(), {
      id: uuidv4(),
      workspaceId: defaultWorkspaceId,
      contactId: c1Id,
      status: ConsentStatus.GRANTED,
      purpose: 'Monthly updates & account notifications',
      source: 'contract_agreement',
      evidenceRef: 'DOC-2026-MSA-04',
      recordedBy: defaultUserId,
      recordedAt: now
    });

    this.data.consentRecords.set(uuidv4(), {
      id: uuidv4(),
      workspaceId: defaultWorkspaceId,
      contactId: c2Id,
      status: ConsentStatus.GRANTED,
      purpose: 'Technical product updates',
      source: 'web_form_optin',
      evidenceRef: 'SUB-8921',
      recordedBy: defaultUserId,
      recordedAt: now
    });

    this.data.consentRecords.set(uuidv4(), {
      id: uuidv4(),
      workspaceId: defaultWorkspaceId,
      contactId: c3Id,
      status: ConsentStatus.GRANTED,
      purpose: 'Executive partner announcements',
      source: 'written_consent',
      evidenceRef: 'EMAIL-2026-03-01',
      recordedBy: defaultUserId,
      recordedAt: now
    });

    // Sample Destinations (Manual Directory)
    const d1 = uuidv4();
    const d2 = uuidv4();
    const d3 = uuidv4();
    const d4 = uuidv4();

    this.data.destinations.set(d1, {
      id: d1,
      workspaceId: defaultWorkspaceId,
      type: DestinationType.INDIVIDUAL,
      displayName: 'Elena Rostova (Direct)',
      description: 'Direct 1-on-1 Viber conversation',
      contactId: c1Id,
      notes: 'Active contact in phonebook',
      status: AccountStatus.ACTIVE,
      createdAt: now
    });

    this.data.destinations.set(d2, {
      id: d2,
      workspaceId: defaultWorkspaceId,
      type: DestinationType.GROUP,
      displayName: 'Strategic Accounts Working Group',
      description: 'Group of top tier client liaisons',
      contactId: null,
      notes: 'Operator is admin of this group',
      status: AccountStatus.ACTIVE,
      createdAt: now
    });

    this.data.destinations.set(d3, {
      id: d3,
      workspaceId: defaultWorkspaceId,
      type: DestinationType.CHANNEL,
      displayName: 'Viber Hub Official Announcements',
      description: 'Public broadcast channel',
      contactId: null,
      notes: 'Channel posts visible to all subscribers',
      status: AccountStatus.ACTIVE,
      createdAt: now
    });

    this.data.destinations.set(d4, {
      id: d4,
      workspaceId: defaultWorkspaceId,
      type: DestinationType.COMMUNITY,
      displayName: 'Global Partners Community',
      description: 'Viber Community for partner network',
      contactId: null,
      notes: 'Requires admin posting rights',
      status: AccountStatus.ACTIVE,
      createdAt: now
    });

    // Sample Templates
    const t1 = uuidv4();
    const t2 = uuidv4();

    this.data.templates.set(t1, {
      id: t1,
      workspaceId: defaultWorkspaceId,
      name: 'Executive Quarterly Briefing',
      category: 'announcement',
      body: 'Hello {{name}},\n\nHere is your quarterly briefing for {{company}}. We have released important updates for your account as of {{date}}.\n\nPlease find the attached summary document. Let us know if you have any questions.\n\nBest regards,\nViber Hub Team',
      createdBy: defaultUserId,
      updatedBy: defaultUserId,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    this.data.templates.set(t2, {
      id: t2,
      workspaceId: defaultWorkspaceId,
      name: 'System Maintenance Notice',
      category: 'service',
      body: 'Dear {{name}},\n\nPlease be advised that our scheduled maintenance will take place on {{date}}. Services for {{company}} will remain unaffected except for a brief 10-minute window.\n\nThank you for your cooperation.',
      createdBy: defaultUserId,
      updatedBy: defaultUserId,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    // Sample Campaign (Demonstrating state machine: Draft -> In Review -> Approved -> Completed Manually)
    const camp1 = uuidv4();
    this.data.campaigns.set(camp1, {
      id: camp1,
      workspaceId: defaultWorkspaceId,
      title: 'Q1 Partnership Briefing Announcement',
      purpose: 'Distribute Q1 executive briefing to priority partners and working group',
      notes: 'Review required before operator handoff to Viber Desktop',
      status: CampaignStatus.APPROVED,
      ownerId: defaultUserId,
      plannedAt: now,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    });

    const item1 = uuidv4();
    this.data.campaignItems.set(item1, {
      id: item1,
      workspaceId: defaultWorkspaceId,
      campaignId: camp1,
      destinationId: d1,
      contactId: c1Id,
      body: 'Hello Elena Rostova,\n\nHere is your quarterly briefing for Rostova Consulting. We have released important updates for your account as of November 2026.\n\nPlease find the attached summary document. Let us know if you have any questions.\n\nBest regards,\nViber Hub Team',
      status: CampaignItemStatus.PREPARED,
      dueAt: now,
      completionNote: null,
      completedBy: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    });

    // Approval record
    const appRecordId = uuidv4();
    this.data.approvalRecords.set(appRecordId, {
      id: appRecordId,
      workspaceId: defaultWorkspaceId,
      campaignId: camp1,
      itemId: null,
      reviewerId: defaultUserId,
      decision: ApprovalDecision.APPROVED,
      note: 'Verified recipient list, personalization variables, and content accuracy.',
      decidedAt: now
    });

    // Activity log entry
    const actId = uuidv4();
    this.data.activityLogs.set(actId, {
      id: actId,
      workspaceId: defaultWorkspaceId,
      actorId: defaultUserId,
      action: 'CAMPAIGN_APPROVED',
      entityType: 'campaign',
      entityId: camp1,
      metadata: JSON.stringify({ campaignTitle: 'Q1 Partnership Briefing Announcement' }),
      createdAt: now
    });

    // Audit log entry
    const audId = uuidv4();
    this.data.auditLogs.set(audId, {
      id: audId,
      workspaceId: defaultWorkspaceId,
      actorId: defaultUserId,
      eventType: 'WORKSPACE_INITIALIZED',
      targetType: 'workspace',
      targetId: defaultWorkspaceId,
      ipAddress: '127.0.0.1',
      userAgent: 'InitialSeed/1.0',
      metadata: JSON.stringify({ message: 'Primary organization initialized with baseline security policies' }),
      createdAt: now
    });
  }
}

export const db = new Store();
