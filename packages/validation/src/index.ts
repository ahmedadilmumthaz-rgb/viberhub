import { z } from 'zod';
import {
  AccountStatus,
  DestinationType,
  ConsentStatus,
  CampaignStatus,
  CampaignItemStatus,
  ApprovalDecision,
  MemberRole
} from '@viberhub/shared';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mfaCode: z.string().length(6, 'MFA code must be 6 digits').optional()
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(100).optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6, 'MFA code must be 6 digits')
});

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en')
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional()
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MemberRole)
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MemberRole)
});

// Viber Account profile label (metadata only, no session credentials)
export const viberAccountSchema = z.object({
  displayName: z.string().min(2).max(100),
  phoneLabel: z.string().max(50).optional(),
  notes: z.string().max(500).optional()
});

// Contact & Tag schemas
export const createContactSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(150),
  phoneOriginal: z.string().min(5, 'Phone number is required').max(30),
  email: z.string().email().optional().nullable().or(z.literal('')),
  organization: z.string().max(150).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  source: z.string().default('manual'),
  tagIds: z.array(z.string().uuid()).optional(),
  consentStatus: z.nativeEnum(ConsentStatus).default(ConsentStatus.UNKNOWN),
  consentPurpose: z.string().optional().nullable(),
  consentEvidence: z.string().optional().nullable()
});

export const updateContactSchema = createContactSchema.partial();

export const contactConsentSchema = z.object({
  status: z.nativeEnum(ConsentStatus),
  purpose: z.string().max(255).optional().nullable(),
  source: z.string().default('manual_update'),
  evidenceRef: z.string().max(255).optional().nullable()
});

export const contactTagsSchema = z.object({
  tagIds: z.array(z.string().uuid())
});

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code').optional().nullable()
});

// CSV Import schema
export const csvImportSchema = z.object({
  fileName: z.string().min(1),
  columnMapping: z.object({
    displayName: z.string(),
    phoneNumber: z.string(),
    email: z.string().optional(),
    organization: z.string().optional(),
    notes: z.string().optional(),
    tags: z.string().optional()
  }),
  duplicatePolicy: z.enum(['skip', 'overwrite']).default('skip'),
  defaultConsentStatus: z.nativeEnum(ConsentStatus).default(ConsentStatus.UNKNOWN)
});

// Destination schema
export const destinationSchema = z.object({
  type: z.nativeEnum(DestinationType),
  displayName: z.string().min(1).max(150),
  description: z.string().max(500).optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(AccountStatus).default(AccountStatus.ACTIVE)
});

// Template schema
export const templateSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(50).default('general'),
  body: z.string().min(1, 'Template body is required').max(4000)
});

// Campaign schemas
export const campaignCreateSchema = z.object({
  title: z.string().min(1).max(200),
  purpose: z.string().max(500).default(''),
  notes: z.string().max(2000).optional().nullable(),
  plannedAt: z.string().datetime().optional().nullable(),
  items: z.array(z.object({
    destinationId: z.string().uuid(),
    contactId: z.string().uuid().optional().nullable(),
    body: z.string().min(1).max(4000),
    dueAt: z.string().datetime().optional().nullable(),
    attachmentIds: z.array(z.string().uuid()).optional()
  })).optional()
});

export const campaignUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  purpose: z.string().max(500).optional(),
  notes: z.string().max(2000).optional().nullable(),
  plannedAt: z.string().datetime().optional().nullable()
});

export const campaignItemCreateSchema = z.object({
  destinationId: z.string().uuid(),
  contactId: z.string().uuid().optional().nullable(),
  body: z.string().min(1).max(4000),
  dueAt: z.string().datetime().optional().nullable(),
  attachmentIds: z.array(z.string().uuid()).optional()
});

export const campaignItemUpdateSchema = z.object({
  body: z.string().min(1).max(4000).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  destinationId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional()
});

export const campaignApprovalSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  note: z.string().max(1000).optional().nullable()
});

export const campaignMarkCompletedSchema = z.object({
  completionNote: z.string().max(1000).optional().nullable()
});

// Device pairing schema
export const deviceRegisterSchema = z.object({
  deviceName: z.string().min(1).max(100),
  platform: z.enum(['android', 'desktop', 'web', 'other'])
});
