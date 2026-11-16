import {
  AccountStatus,
  DestinationType,
  ConsentStatus,
  CampaignStatus,
  CampaignItemStatus,
  ApprovalDecision,
  MemberRole,
  ImportStatus
} from './enums.js';

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  role: MemberRole;
  createdAt: string;
}

export interface ContactDto {
  id: string;
  workspaceId: string;
  displayName: string;
  phoneOriginal: string;
  phoneE164: string;
  email?: string | null;
  organization?: string | null;
  notes?: string | null;
  source: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: TagDto[];
  latestConsent?: ConsentRecordDto | null;
}

export interface TagDto {
  id: string;
  workspaceId: string;
  name: string;
  color?: string | null;
  archivedAt?: string | null;
  createdAt: string;
}

export interface ConsentRecordDto {
  id: string;
  workspaceId: string;
  contactId: string;
  status: ConsentStatus;
  purpose?: string | null;
  source: string;
  evidenceRef?: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface DestinationDto {
  id: string;
  workspaceId: string;
  type: DestinationType;
  displayName: string;
  description?: string | null;
  contactId?: string | null;
  contact?: ContactDto | null;
  notes?: string | null;
  status: AccountStatus;
  createdAt: string;
}

export interface MessageTemplateDto {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  body: string;
  createdBy: string;
  updatedBy: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentDto {
  id: string;
  workspaceId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  uploadedBy: string;
  createdAt: string;
  downloadUrl?: string;
}

export interface CampaignDto {
  id: string;
  workspaceId: string;
  title: string;
  purpose: string;
  notes?: string | null;
  status: CampaignStatus;
  ownerId: string;
  ownerName?: string;
  plannedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: CampaignItemDto[];
  approvals?: ApprovalRecordDto[];
  itemCount?: number;
}

export interface CampaignItemDto {
  id: string;
  workspaceId: string;
  campaignId: string;
  destinationId: string;
  destination?: DestinationDto;
  contactId?: string | null;
  contact?: ContactDto | null;
  body: string;
  status: CampaignItemStatus;
  dueAt?: string | null;
  completionNote?: string | null;
  completedBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentDto[];
}

export interface ApprovalRecordDto {
  id: string;
  workspaceId: string;
  campaignId: string;
  itemId?: string | null;
  reviewerId: string;
  reviewerName?: string;
  decision: ApprovalDecision;
  note?: string | null;
  decidedAt: string;
}

export interface ActivityLogDto {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  workspaceId: string;
  actorId: string;
  eventType: string;
  targetType: string;
  targetId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ViberAccountDto {
  id: string;
  workspaceId: string;
  displayName: string;
  phoneLabel?: string | null;
  status: AccountStatus;
  notes?: string | null;
  createdAt: string;
}

export interface DeviceDto {
  id: string;
  workspaceId: string;
  userId: string;
  deviceName: string;
  platform: string;
  pairedAt: string;
  lastSeenAt?: string | null;
  revokedAt?: string | null;
}
