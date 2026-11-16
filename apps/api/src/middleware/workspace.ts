import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { db } from '../db/store.js';
import { AccountStatus } from '@viberhub/shared';

export function workspaceMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
    });
  }

  // Get workspaceId from header or query param
  let workspaceId = (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string);

  // If not explicitly provided, find the user's first active workspace membership
  if (!workspaceId) {
    const memberships = Array.from(db.data.workspaceMembers.values()).filter(
      (m) => m.userId === req.userId && m.status === AccountStatus.ACTIVE
    );

    if (memberships.length > 0) {
      workspaceId = memberships[0].workspaceId;
    }
  }

  if (!workspaceId) {
    return res.status(400).json({
      error: { code: 'NO_WORKSPACE', message: 'No workspace context selected' }
    });
  }

  // Check membership
  const membership = Array.from(db.data.workspaceMembers.values()).find(
    (m) =>
      m.workspaceId === workspaceId &&
      m.userId === req.userId &&
      m.status === AccountStatus.ACTIVE
  );

  if (!membership) {
    // Non-disclosing 404 as required by spec Section 10
    return res.status(404).json({
      error: {
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found or access denied'
      }
    });
  }

  req.workspaceId = workspaceId;
  req.userRole = membership.role;
  next();
}
