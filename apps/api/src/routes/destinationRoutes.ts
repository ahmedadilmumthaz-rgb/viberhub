import { Router, Response } from 'express';
import { DestinationService } from '../services/destinationService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireEditorOrAbove } from '../middleware/rbac.js';
import { destinationSchema } from '@viberhub/validation';
import { DestinationType, successEnvelope } from '@viberhub/shared';
import { logActivityEvent, logAuditEvent } from '../middleware/audit.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const type = req.query.type as DestinationType;
    const destinations = await DestinationService.listDestinations(req.workspaceId!, type);
    res.json(successEnvelope(destinations));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = destinationSchema.parse(req.body);
    const destination = await DestinationService.createDestination(req.workspaceId!, validated);

    logActivityEvent(req, 'DESTINATION_CREATED', 'destination', destination.id, {
      displayName: destination.displayName,
      type: destination.type
    });
    logAuditEvent(req, 'DESTINATION_CREATED', 'destination', destination.id);

    res.status(201).json(successEnvelope(destination));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const destination = await DestinationService.getDestinationById(req.workspaceId!, req.params.id);
    res.json(successEnvelope(destination));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const destination = await DestinationService.updateDestination(
      req.workspaceId!,
      req.params.id,
      req.body
    );

    logActivityEvent(req, 'DESTINATION_UPDATED', 'destination', destination.id);
    logAuditEvent(req, 'DESTINATION_UPDATED', 'destination', destination.id);

    res.json(successEnvelope(destination));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await DestinationService.deleteDestination(req.workspaceId!, req.params.id);
    logAuditEvent(req, 'DESTINATION_DEACTIVATED', 'destination', req.params.id);

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

export const destinationRoutes = router;
