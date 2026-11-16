import { Router, Response } from 'express';
import { ContactService } from '../services/contactService.js';
import { ImportExportService } from '../services/importExportService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireEditorOrAbove, requireRole } from '../middleware/rbac.js';
import { logAuditEvent, logActivityEvent } from '../middleware/audit.js';
import {
  createContactSchema,
  updateContactSchema,
  contactConsentSchema,
  tagSchema,
  csvImportSchema
} from '@viberhub/validation';
import { MemberRole, ConsentStatus, successEnvelope } from '@viberhub/shared';
import { db } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const search = req.query.search as string;
    const tagId = req.query.tagId as string;
    const consentStatus = req.query.consentStatus as ConsentStatus;
    const archived = req.query.archived === 'true';

    const result = await ContactService.listContacts(req.workspaceId!, {
      search,
      tagId,
      consentStatus,
      archived,
      page,
      limit
    });

    res.json(successEnvelope(result.contacts, result.meta));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = createContactSchema.parse(req.body);
    const contact = await ContactService.createContact(
      req.workspaceId!,
      req.userId!,
      validated as any
    );

    logActivityEvent(req, 'CONTACT_CREATED', 'contact', contact.id, {
      displayName: contact.displayName,
      phoneE164: contact.phoneE164
    });

    logAuditEvent(req, 'CONTACT_CREATED', 'contact', contact.id);

    res.status(201).json(successEnvelope(contact));
  } catch (err) {
    next(err);
  }
});

router.get('/export', requireRole(MemberRole.ADMINISTRATOR), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const csvData = await ImportExportService.exportContactsToCsv(req.workspaceId!);
    logAuditEvent(req, 'CONTACTS_EXPORTED', 'workspace', req.workspaceId!);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="viberhub_contacts.csv"');
    res.send(csvData);
  } catch (err) {
    next(err);
  }
});

router.post('/import', requireEditorOrAbove, uploadRateLimiter, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = csvImportSchema.parse(req.body);
    const rows = (req.body.rows as Array<Record<string, string>>) || [];

    const result = await ImportExportService.processCsvImport(
      req.workspaceId!,
      req.userId!,
      validated.fileName,
      rows,
      validated.columnMapping,
      validated.duplicatePolicy,
      validated.defaultConsentStatus
    );

    logAuditEvent(req, 'CONTACTS_IMPORTED', 'import_batch', result.batchId, {
      totalRows: result.totalRows,
      importedRows: result.importedRows,
      rejectedRows: result.rejectedRows
    });

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

// Tags management
router.get('/tags/all', (req: AuthenticatedRequest, res: Response) => {
  const tags = Array.from(db.data.tags.values()).filter(
    (t) => t.workspaceId === req.workspaceId && !t.archivedAt
  );
  res.json(successEnvelope(tags));
});

router.post('/tags/all', requireEditorOrAbove, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = tagSchema.parse(req.body);
    const existing = Array.from(db.data.tags.values()).find(
      (t) => t.workspaceId === req.workspaceId && t.name.toLowerCase() === validated.name.toLowerCase() && !t.archivedAt
    );

    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_TAG', message: `Tag "${validated.name}" already exists` }
      });
    }

    const tagId = uuidv4();
    const tag = {
      id: tagId,
      workspaceId: req.workspaceId!,
      name: validated.name.trim(),
      color: validated.color || '#6366f1',
      archivedAt: null,
      createdAt: new Date().toISOString()
    };

    db.data.tags.set(tagId, tag);
    res.status(201).json(successEnvelope(tag));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const contact = await ContactService.getContactById(req.workspaceId!, req.params.id);
    res.json(successEnvelope(contact));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = updateContactSchema.parse(req.body);
    const contact = await ContactService.updateContact(req.workspaceId!, req.params.id, validated);

    logActivityEvent(req, 'CONTACT_UPDATED', 'contact', contact.id);
    logAuditEvent(req, 'CONTACT_UPDATED', 'contact', contact.id);

    res.json(successEnvelope(contact));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await ContactService.archiveContact(req.workspaceId!, req.params.id);

    logActivityEvent(req, 'CONTACT_ARCHIVED', 'contact', req.params.id);
    logAuditEvent(req, 'CONTACT_ARCHIVED', 'contact', req.params.id);

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/consent', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = contactConsentSchema.parse(req.body);
    const record = await ContactService.recordConsent(
      req.workspaceId!,
      req.params.id,
      req.userId!,
      validated
    );

    logAuditEvent(req, 'CONSENT_STATUS_CHANGED', 'contact', req.params.id, {
      newStatus: record.status,
      purpose: record.purpose
    });

    res.json(successEnvelope(record));
  } catch (err) {
    next(err);
  }
});

export const contactRoutes = router;
