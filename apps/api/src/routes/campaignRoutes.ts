import { Router, Response } from 'express';
import { CampaignService } from '../services/campaignService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireEditorOrAbove, requireReviewerOrAdmin } from '../middleware/rbac.js';
import {
  campaignCreateSchema,
  campaignUpdateSchema,
  campaignApprovalSchema,
  campaignMarkCompletedSchema
} from '@viberhub/validation';
import { CampaignStatus, successEnvelope } from '@viberhub/shared';
import { logActivityEvent, logAuditEvent } from '../middleware/audit.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const status = req.query.status as CampaignStatus;
    const campaigns = await CampaignService.listCampaigns(req.workspaceId!, status);
    res.json(successEnvelope(campaigns));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = campaignCreateSchema.parse(req.body);
    const campaign = await CampaignService.createCampaign(
      req.workspaceId!,
      req.userId!,
      validated
    );

    logActivityEvent(req, 'CAMPAIGN_CREATED', 'campaign', campaign.id, { title: campaign.title });
    logAuditEvent(req, 'CAMPAIGN_CREATED', 'campaign', campaign.id);

    res.status(201).json(successEnvelope(campaign));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const campaign = await CampaignService.getCampaignById(req.workspaceId!, req.params.id);
    res.json(successEnvelope(campaign));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/submit-review', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const campaign = await CampaignService.submitForReview(req.workspaceId!, req.params.id, req.userId!);

    logActivityEvent(req, 'CAMPAIGN_SUBMITTED_FOR_REVIEW', 'campaign', campaign.id);
    logAuditEvent(req, 'CAMPAIGN_SUBMITTED_FOR_REVIEW', 'campaign', campaign.id);

    res.json(successEnvelope(campaign));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', requireReviewerOrAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = campaignApprovalSchema.parse(req.body);
    const campaign = await CampaignService.approveOrReject(
      req.workspaceId!,
      req.params.id,
      req.userId!,
      validated.decision,
      validated.note
    );

    logActivityEvent(req, `CAMPAIGN_${validated.decision}`, 'campaign', campaign.id, {
      decision: validated.decision,
      note: validated.note
    });
    logAuditEvent(req, `CAMPAIGN_${validated.decision}`, 'campaign', campaign.id, {
      decision: validated.decision
    });

    res.json(successEnvelope(campaign));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/items/:itemId/mark-completed', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = campaignMarkCompletedSchema.parse(req.body);
    const item = await CampaignService.markItemCompleted(
      req.workspaceId!,
      req.params.id,
      req.params.itemId,
      req.userId!,
      validated.completionNote
    );

    logActivityEvent(req, 'ITEM_COMPLETED_MANUALLY', 'campaign_item', item.id, {
      note: item.completionNote
    });
    logAuditEvent(req, 'ITEM_COMPLETED_MANUALLY', 'campaign_item', item.id);

    res.json(successEnvelope(item));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await CampaignService.archiveCampaign(req.workspaceId!, req.params.id);
    logAuditEvent(req, 'CAMPAIGN_ARCHIVED', 'campaign', req.params.id);

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

export const campaignRoutes = router;
