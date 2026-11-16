import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { normalizePhoneToE164, isValidE164, ConsentStatus } from '@viberhub/shared';

export interface ContactFilters {
  search?: string;
  tagId?: string;
  consentStatus?: ConsentStatus;
  archived?: boolean;
  page?: number;
  limit?: number;
}

export class ContactService {
  static async listContacts(workspaceId: string, filters: ContactFilters = {}) {
    const {
      search,
      tagId,
      consentStatus,
      archived = false,
      page = 1,
      limit = 50
    } = filters;

    let contacts = Array.from(db.data.contacts.values()).filter(
      (c) => c.workspaceId === workspaceId && (archived ? c.archivedAt !== null : c.archivedAt === null)
    );

    // Filter by tag
    if (tagId) {
      const contactIdsWithTag = new Set(
        Array.from(db.data.contactTags.values())
          .filter((ct) => ct.tagId === tagId)
          .map((ct) => ct.contactId)
      );
      contacts = contacts.filter((c) => contactIdsWithTag.has(c.id));
    }

    // Filter by search string
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.phoneOriginal.includes(q) ||
          c.phoneE164.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.organization && c.organization.toLowerCase().includes(q))
      );
    }

    // Attach tags and latest consent
    const enriched = contacts.map((c) => {
      const contactTags = Array.from(db.data.contactTags.values())
        .filter((ct) => ct.contactId === c.id)
        .map((ct) => db.data.tags.get(ct.tagId))
        .filter(Boolean);

      const consentRecords = Array.from(db.data.consentRecords.values())
        .filter((cr) => cr.contactId === c.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

      const latestConsent = consentRecords.length > 0 ? consentRecords[0] : null;

      return {
        ...c,
        tags: contactTags,
        latestConsent
      };
    });

    // Filter by consentStatus if provided
    let finalItems = enriched;
    if (consentStatus) {
      finalItems = enriched.filter((c) => c.latestConsent?.status === consentStatus);
    }

    // Sort by createdAt descending
    finalItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = finalItems.length;
    const startIndex = (page - 1) * limit;
    const paginated = finalItems.slice(startIndex, startIndex + limit);

    return {
      contacts: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getContactById(workspaceId: string, contactId: string) {
    const contact = db.data.contacts.get(contactId);
    if (!contact || contact.workspaceId !== workspaceId) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const tags = Array.from(db.data.contactTags.values())
      .filter((ct) => ct.contactId === contact.id)
      .map((ct) => db.data.tags.get(ct.tagId))
      .filter(Boolean);

    const consentRecords = Array.from(db.data.consentRecords.values())
      .filter((cr) => cr.contactId === contact.id)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    return {
      ...contact,
      tags,
      consentRecords,
      latestConsent: consentRecords.length > 0 ? consentRecords[0] : null
    };
  }

  static async createContact(
    workspaceId: string,
    actorId: string,
    data: {
      displayName: string;
      phoneOriginal: string;
      email?: string | null;
      organization?: string | null;
      notes?: string | null;
      source?: string;
      tagIds?: string[];
      consentStatus?: ConsentStatus;
      consentPurpose?: string | null;
      consentEvidence?: string | null;
    }
  ) {
    const phoneE164 = normalizePhoneToE164(data.phoneOriginal);

    // Duplicate check within workspace
    const existing = Array.from(db.data.contacts.values()).find(
      (c) => c.workspaceId === workspaceId && c.phoneE164 === phoneE164 && !c.archivedAt
    );

    if (existing) {
      const err: any = new Error(`Contact with phone ${phoneE164} already exists in this workspace`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_PHONE';
      throw err;
    }

    const contactId = uuidv4();
    const now = new Date().toISOString();

    const contact = {
      id: contactId,
      workspaceId,
      displayName: data.displayName.trim(),
      phoneOriginal: data.phoneOriginal.trim(),
      phoneE164,
      email: data.email ? data.email.trim().toLowerCase() : null,
      organization: data.organization ? data.organization.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      source: data.source || 'manual',
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    };

    db.data.contacts.set(contactId, contact);

    // Tag assignments
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        db.data.contactTags.set(`${contactId}_${tagId}`, { contactId, tagId });
      }
    }

    // Consent record
    if (data.consentStatus) {
      const consentId = uuidv4();
      db.data.consentRecords.set(consentId, {
        id: consentId,
        workspaceId,
        contactId,
        status: data.consentStatus,
        purpose: data.consentPurpose || 'Direct communication',
        source: data.source || 'manual_creation',
        evidenceRef: data.consentEvidence || null,
        recordedBy: actorId,
        recordedAt: now
      });
    }

    return this.getContactById(workspaceId, contactId);
  }

  static async updateContact(
    workspaceId: string,
    contactId: string,
    data: any
  ) {
    const contact = db.data.contacts.get(contactId);
    if (!contact || contact.workspaceId !== workspaceId) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();

    if (data.phoneOriginal && data.phoneOriginal !== contact.phoneOriginal) {
      const newPhoneE164 = normalizePhoneToE164(data.phoneOriginal);
      const existing = Array.from(db.data.contacts.values()).find(
        (c) => c.workspaceId === workspaceId && c.id !== contactId && c.phoneE164 === newPhoneE164 && !c.archivedAt
      );
      if (existing) {
        const err: any = new Error(`Another contact with phone ${newPhoneE164} already exists`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_PHONE';
        throw err;
      }
      contact.phoneOriginal = data.phoneOriginal;
      contact.phoneE164 = newPhoneE164;
    }

    if (data.displayName !== undefined) contact.displayName = data.displayName;
    if (data.email !== undefined) contact.email = data.email ? data.email.toLowerCase() : null;
    if (data.organization !== undefined) contact.organization = data.organization;
    if (data.notes !== undefined) contact.notes = data.notes;
    contact.updatedAt = now;

    // Update tags if provided
    if (data.tagIds !== undefined) {
      // Remove existing
      for (const [key, ct] of db.data.contactTags.entries()) {
        if (ct.contactId === contactId) {
          db.data.contactTags.delete(key);
        }
      }
      // Re-assign
      for (const tId of data.tagIds) {
        db.data.contactTags.set(`${contactId}_${tId}`, { contactId, tagId: tId });
      }
    }

    return this.getContactById(workspaceId, contactId);
  }

  static async archiveContact(workspaceId: string, contactId: string) {
    const contact = db.data.contacts.get(contactId);
    if (!contact || contact.workspaceId !== workspaceId) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    contact.archivedAt = new Date().toISOString();
    return { success: true, id: contactId, archivedAt: contact.archivedAt };
  }

  static async recordConsent(
    workspaceId: string,
    contactId: string,
    actorId: string,
    data: {
      status: ConsentStatus;
      purpose?: string | null;
      source: string;
      evidenceRef?: string | null;
    }
  ) {
    const contact = db.data.contacts.get(contactId);
    if (!contact || contact.workspaceId !== workspaceId) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const consentId = uuidv4();
    const now = new Date().toISOString();

    const record = {
      id: consentId,
      workspaceId,
      contactId,
      status: data.status,
      purpose: data.purpose || null,
      source: data.source,
      evidenceRef: data.evidenceRef || null,
      recordedBy: actorId,
      recordedAt: now
    };

    db.data.consentRecords.set(consentId, record);
    return record;
  }

  static async mergeContacts(
    workspaceId: string,
    primaryContactId: string,
    duplicateContactId: string,
    actorId: string
  ) {
    if (primaryContactId === duplicateContactId) {
      const err: any = new Error('Cannot merge a contact into itself');
      err.statusCode = 400;
      err.code = 'INVALID_MERGE_TARGET';
      throw err;
    }

    const primary = db.data.contacts.get(primaryContactId);
    const duplicate = db.data.contacts.get(duplicateContactId);

    if (!primary || primary.workspaceId !== workspaceId || primary.archivedAt) {
      const err: any = new Error('Primary contact not found or archived');
      err.statusCode = 404;
      err.code = 'PRIMARY_NOT_FOUND';
      throw err;
    }

    if (!duplicate || duplicate.workspaceId !== workspaceId || duplicate.archivedAt) {
      const err: any = new Error('Duplicate contact not found or archived');
      err.statusCode = 404;
      err.code = 'DUPLICATE_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();

    // 1. Merge missing fields into primary
    if (!primary.email && duplicate.email) primary.email = duplicate.email;
    if (!primary.organization && duplicate.organization) primary.organization = duplicate.organization;
    if (duplicate.notes) {
      primary.notes = primary.notes
        ? `${primary.notes}\n[Merged Note]: ${duplicate.notes}`
        : duplicate.notes;
    }
    primary.updatedAt = now;

    // 2. Transfer tags from duplicate to primary
    const duplicateTags = Array.from(db.data.contactTags.values())
      .filter((ct) => ct.contactId === duplicateContactId)
      .map((ct) => ct.tagId);

    for (const tagId of duplicateTags) {
      const key = `${primaryContactId}_${tagId}`;
      if (!db.data.contactTags.has(key)) {
        db.data.contactTags.set(key, { contactId: primaryContactId, tagId });
      }
    }

    // 3. Re-assign destinations pointing to duplicate
    for (const dest of db.data.destinations.values()) {
      if (dest.contactId === duplicateContactId) {
        dest.contactId = primaryContactId;
      }
    }

    // 4. Re-assign consent records
    for (const consent of db.data.consentRecords.values()) {
      if (consent.contactId === duplicateContactId) {
        consent.contactId = primaryContactId;
      }
    }

    // 5. Re-assign campaign items
    for (const item of db.data.campaignItems.values()) {
      if (item.contactId === duplicateContactId) {
        item.contactId = primaryContactId;
      }
    }

    // 6. Archive duplicate contact
    duplicate.archivedAt = now;
    duplicate.notes = `[ARCHIVED - Merged into contact ${primaryContactId} by ${actorId}] ${duplicate.notes || ''}`;

    return this.getContactById(workspaceId, primaryContactId);
  }
}
