import { Router, Response } from 'express';
import { TemplateService } from '../services/templateService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireEditorOrAbove } from '../middleware/rbac.js';
import { templateSchema } from '@viberhub/validation';
import { successEnvelope } from '@viberhub/shared';
import { logActivityEvent, logAuditEvent } from '../middleware/audit.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const category = req.query.category as string;
    const templates = await TemplateService.listTemplates(req.workspaceId!, category);
    res.json(successEnvelope(templates));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = templateSchema.parse(req.body);
    const template = await TemplateService.createTemplate(
      req.workspaceId!,
      req.userId!,
      validated
    );

    logActivityEvent(req, 'TEMPLATE_CREATED', 'template', template.id, { name: template.name });
    logAuditEvent(req, 'TEMPLATE_CREATED', 'template', template.id);

    res.status(201).json(successEnvelope(template));
  } catch (err) {
    next(err);
  }
});

router.post('/preview', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { body, contactId, context } = req.body;
    if (!body) {
      return res.status(400).json({
        error: { code: 'MISSING_BODY', message: 'Template body is required for preview' }
      });
    }

    const preview = await TemplateService.previewTemplate(
      req.workspaceId!,
      body,
      contactId,
      context
    );

    res.json(successEnvelope(preview));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const template = await TemplateService.getTemplateById(req.workspaceId!, req.params.id);
    res.json(successEnvelope(template));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const template = await TemplateService.updateTemplate(
      req.workspaceId!,
      req.params.id,
      req.userId!,
      req.body
    );

    logActivityEvent(req, 'TEMPLATE_UPDATED', 'template', template.id);
    logAuditEvent(req, 'TEMPLATE_UPDATED', 'template', template.id);

    res.json(successEnvelope(template));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await TemplateService.archiveTemplate(req.workspaceId!, req.params.id);
    logAuditEvent(req, 'TEMPLATE_ARCHIVED', 'template', req.params.id);

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

export const templateRoutes = router;
