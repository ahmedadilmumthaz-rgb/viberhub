import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { successEnvelope } from '@viberhub/shared';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const items = Array.from(db.data.campaignItems.values()).filter(
    (ci) => ci.workspaceId === req.workspaceId
  );

  const plannerTasks = items.map((item) => {
    const campaign = db.data.campaigns.get(item.campaignId);
    const destination = db.data.destinations.get(item.destinationId);
    const contact = item.contactId ? db.data.contacts.get(item.contactId) : null;

    return {
      id: item.id,
      campaignId: item.campaignId,
      campaignTitle: campaign?.title || 'Untitled Campaign',
      campaignStatus: campaign?.status,
      destinationType: destination?.type,
      destinationName: destination?.displayName,
      contactName: contact?.displayName,
      body: item.body,
      status: item.status,
      dueAt: item.dueAt || campaign?.plannedAt || item.createdAt,
      completedAt: item.completedAt,
      completedBy: item.completedBy,
      completionNote: item.completionNote
    };
  });

  plannerTasks.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  res.json(successEnvelope(plannerTasks));
});

export const plannerRoutes = router;
