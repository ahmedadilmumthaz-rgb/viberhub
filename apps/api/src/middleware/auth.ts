import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/store.js';
import { AccountStatus, AuthUser } from '@viberhub/shared';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  userId?: string;
  workspaceId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.vh_session) {
    // Check HTTP-only cookie
    token = req.cookies.vh_session;
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication session required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, config.sessionSecret) as { userId: string; email: string };
    const user = db.data.users.get(decoded.userId);

    if (!user || user.status !== AccountStatus.ACTIVE) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Account is invalid, inactive, or revoked'
        }
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt
    };
    req.userId = user.id;

    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication session'
      }
    });
  }
}
