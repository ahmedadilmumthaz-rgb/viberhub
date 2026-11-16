import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import {
  normalizePhoneToE164,
  ConsentStatus,
  ImportStatus
} from '@viberhub/shared';

export interface ImportPreviewRow {
  rowNumber: number;
  displayName: string;
  phoneOriginal: string;
  phoneE164: string;
  email?: string;
  organization?: string;
  notes?: string;
  tags?: string[];
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export class ImportExportService {
  static async processCsvImport(
    workspaceId: string,
    actorId: string,
    fileName: string,
    rows: Array<Record<string, string>>,
    mapping: {
      displayName: string;
      phoneNumber: string;
      email?: string;
      organization?: string;
      notes?: string;
      tags?: string;
    },
    duplicatePolicy: 'skip' | 'overwrite' = 'skip',
    defaultConsent: ConsentStatus = ConsentStatus.UNKNOWN
  ) {
    const batchId = uuidv4();
    const now = new Date().toISOString();

    let importedCount = 0;
    let rejectedCount = 0;
    const errorDetails: Array<{ row: number; error: string }> = [];

    // Existing phone numbers in this workspace
    const existingContactsMap = new Map<string, any>();
    for (const c of db.data.contacts.values()) {
      if (c.workspaceId === workspaceId && !c.archivedAt) {
        existingContactsMap.set(c.phoneE164, c);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowNum = i + 1;

      const displayName = (rawRow[mapping.displayName] || '').trim();
      const rawPhone = (rawRow[mapping.phoneNumber] || '').trim();
      const email = mapping.email && rawRow[mapping.email] ? rawRow[mapping.email].trim().toLowerCase() : null;
      const organization = mapping.organization && rawRow[mapping.organization] ? rawRow[mapping.organization].trim() : null;
      const notes = mapping.notes && rawRow[mapping.notes] ? rawRow[mapping.notes].trim() : null;
      const rawTags = mapping.tags && rawRow[mapping.tags] ? rawRow[mapping.tags] : '';

      if (!displayName) {
        rejectedCount++;
        errorDetails.push({ row: rowNum, error: 'Missing required display name' });
        continue;
      }

      if (!rawPhone) {
        rejectedCount++;
        errorDetails.push({ row: rowNum, error: 'Missing required phone number' });
        continue;
      }

      const phoneE164 = normalizePhoneToE164(rawPhone);
      if (!phoneE164 || phoneE164.length < 8) {
        rejectedCount++;
        errorDetails.push({ row: rowNum, error: `Invalid phone number format: "${rawPhone}"` });
        continue;
      }

      const existing = existingContactsMap.get(phoneE164);

      if (existing) {
        if (duplicatePolicy === 'skip') {
          rejectedCount++;
          errorDetails.push({ row: rowNum, error: `Duplicate phone number ${phoneE164} skipped` });
          continue;
        } else if (duplicatePolicy === 'overwrite') {
          // Overwrite existing contact fields
          existing.displayName = displayName;
          if (email) existing.email = email;
          if (organization) existing.organization = organization;
          if (notes) existing.notes = notes;
          existing.updatedAt = now;
          importedCount++;
          continue;
        }
      }

      // Create new contact
      const contactId = uuidv4();
      const newContact = {
        id: contactId,
        workspaceId,
        displayName,
        phoneOriginal: rawPhone,
        phoneE164,
        email,
        organization,
        notes,
        source: `import:${fileName}`,
        archivedAt: null,
        createdAt: now,
        updatedAt: now
      };

      db.data.contacts.set(contactId, newContact);
      existingContactsMap.set(phoneE164, newContact);

      // Handle tags
      if (rawTags) {
        const tagNames = rawTags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          let tag = Array.from(db.data.tags.values()).find(
            (t) => t.workspaceId === workspaceId && t.name.toLowerCase() === tagName.toLowerCase()
          );
          if (!tag) {
            const tId = uuidv4();
            tag = {
              id: tId,
              workspaceId,
              name: tagName,
              color: '#6366f1',
              archivedAt: null,
              createdAt: now
            };
            db.data.tags.set(tId, tag);
          }
          db.data.contactTags.set(`${contactId}_${tag.id}`, { contactId, tagId: tag.id });
        }
      }

      // Initial consent record
      const consentId = uuidv4();
      db.data.consentRecords.set(consentId, {
        id: consentId,
        workspaceId,
        contactId,
        status: defaultConsent,
        purpose: 'Imported contact record',
        source: `csv_import:${fileName}`,
        evidenceRef: `BATCH-${batchId}`,
        recordedBy: actorId,
        recordedAt: now
      });

      importedCount++;
    }

    const finalStatus =
      rejectedCount === 0
        ? ImportStatus.COMPLETED
        : importedCount > 0
        ? ImportStatus.COMPLETED_WITH_ERRORS
        : ImportStatus.FAILED;

    const batch = {
      id: batchId,
      workspaceId,
      entityType: 'contact',
      fileName,
      status: finalStatus,
      totalRows: rows.length,
      importedRows: importedCount,
      rejectedRows: rejectedCount,
      errorDetails: errorDetails.length > 0 ? JSON.stringify(errorDetails) : null,
      createdBy: actorId,
      createdAt: now
    };

    db.data.importBatches.set(batchId, batch);

    return {
      batchId,
      status: finalStatus,
      totalRows: rows.length,
      importedRows: importedCount,
      rejectedRows: rejectedCount,
      errors: errorDetails
    };
  }

  static async exportContactsToCsv(workspaceId: string) {
    const contacts = Array.from(db.data.contacts.values()).filter(
      (c) => c.workspaceId === workspaceId && !c.archivedAt
    );

    const headers = ['ID', 'Display Name', 'Phone E164', 'Phone Original', 'Email', 'Organization', 'Tags', 'Consent Status', 'Created At'];
    const rows = contacts.map((c) => {
      const tags = Array.from(db.data.contactTags.values())
        .filter((ct) => ct.contactId === c.id)
        .map((ct) => db.data.tags.get(ct.tagId)?.name)
        .filter(Boolean)
        .join('; ');

      const consent = Array.from(db.data.consentRecords.values())
        .filter((cr) => cr.contactId === c.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

      return [
        c.id,
        `"${c.displayName.replace(/"/g, '""')}"`,
        c.phoneE164,
        `"${c.phoneOriginal.replace(/"/g, '""')}"`,
        c.email ? `"${c.email.replace(/"/g, '""')}"` : '',
        c.organization ? `"${c.organization.replace(/"/g, '""')}"` : '',
        `"${tags.replace(/"/g, '""')}"`,
        consent ? consent.status : ConsentStatus.UNKNOWN,
        c.createdAt
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
