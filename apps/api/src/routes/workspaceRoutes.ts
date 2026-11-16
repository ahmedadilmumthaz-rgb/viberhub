import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createWorkspaceSchema, addMemberSchema } from '@viberhub/validation';
import { MemberRole, AccountStatus, successEnvelope } from '@viberhub/shared';
import { logAuditEvent } from '../middleware/audit.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const memberships = Array.from(db.data.workspaceMembers.values()).filter(
    (m) => m.userId === req.userId && m.status === AccountStatus.ACTIVE
  );

  const workspaces = memberships.map((m) => {
    const ws = db.data.workspaces.get(m.workspaceId);
    return {
      id: ws.id,
      name: ws.name,
      timezone: ws.timezone,
      locale: ws.locale,
      role: m.role,
      joinedAt: m.joinedAt
    };
  });

  res.json(successEnvelope(workspaces));
});

router.post('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const validated = createWorkspaceSchema.parse(req.body);
    const workspaceId = uuidv4();
    const now = new Date().toISOString();

    const workspace = {
      id: workspaceId,
      name: validated.name.trim(),
      timezone: validated.timezone,
      locale: validated.locale,
      createdAt: now,
      updatedAt: now
    };

    db.data.workspaces.set(workspaceId, workspace);

    const memberId = uuidv4();
    db.data.workspaceMembers.set(memberId, {
      id: memberId,
      workspaceId,
      userId: req.userId!,
      role: MemberRole.OWNER,
      status: AccountStatus.ACTIVE,
      joinedAt: now
    });

    logAuditEvent(req, 'WORKSPACE_CREATED', 'workspace', workspaceId, { name: workspace.name });

    res.status(201).json(successEnvelope({
      ...workspace,
      role: MemberRole.OWNER
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspace = db.data.workspaces.get(req.params.id);
  const membership = Array.from(db.data.workspaceMembers.values()).find(
    (m) => m.workspaceId === req.params.id && m.userId === req.userId && m.status === AccountStatus.ACTIVE
  );

  if (!workspace || !membership) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Workspace not found or access denied' }
    });
  }

  res.json(successEnvelope({
    ...workspace,
    role: membership.role
  }));
});

router.get('/:id/members', (req: AuthenticatedRequest, res: Response) => {
  const members = Array.from(db.data.workspaceMembers.values())
    .filter((m) => m.workspaceId === req.params.id && m.status === AccountStatus.ACTIVE)
    .map((m) => {
      const user = db.data.users.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        email: user?.email,
        displayName: user?.displayName,
        role: m.role,
        joinedAt: m.joinedAt
      };
    });

  res.json(successEnvelope(members));
});

export const workspaceRoutes = router;
