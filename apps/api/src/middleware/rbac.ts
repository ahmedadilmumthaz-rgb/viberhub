import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { MemberRole } from '@viberhub/shared';

const ROLE_RANK: Record<MemberRole, number> = {
  [MemberRole.OWNER]: 50,
  [MemberRole.ADMINISTRATOR]: 40,
  [MemberRole.REVIEWER]: 30,
  [MemberRole.EDITOR]: 20,
  [MemberRole.VIEWER]: 10
};

export function requireRole(minimumRole: MemberRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole as MemberRole;

    if (!userRole) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'No role assigned in this workspace' }
      });
    }

    const currentRank = ROLE_RANK[userRole] || 0;
    const requiredRank = ROLE_RANK[minimumRole] || 0;

    if (currentRank < requiredRank) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Requires at least ${minimumRole}`
        }
      });
    }

    next();
  };
}

export function requireReviewerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userRole = req.userRole as MemberRole;
  if (
    userRole === MemberRole.OWNER ||
    userRole === MemberRole.ADMINISTRATOR ||
    userRole === MemberRole.REVIEWER
  ) {
    return next();
  }

  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Review and approval actions require Reviewer, Administrator, or Owner role'
    }
  });
}

export function requireEditorOrAbove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userRole = req.userRole as MemberRole;
  if (userRole === MemberRole.VIEWER) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Viewer accounts have read-only access' }
    });
  }
  next();
}
