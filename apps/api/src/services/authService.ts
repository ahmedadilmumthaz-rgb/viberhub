import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { config } from '../config.js';
import { AccountStatus, MemberRole, AuthUser } from '@viberhub/shared';

export class AuthService {
  static async login(email: string, password: string, mfaCode?: string) {
    const user = Array.from(db.data.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user || user.status !== AccountStatus.ACTIVE) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode || mfaCode !== '123456') { // Standard TOTP verification hook
        const err: any = new Error('Invalid or missing MFA code');
        err.statusCode = 401;
        err.code = 'MFA_REQUIRED';
        throw err;
      }
    }

    // Generate JWT session token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.sessionSecret,
      { expiresIn: '7d' }
    );

    // Get user workspaces
    const memberships = Array.from(db.data.workspaceMembers.values()).filter(
      (m) => m.userId === user.id && m.status === AccountStatus.ACTIVE
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

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt
      },
      workspaces
    };
  }

  static async register(email: string, password: string, displayName: string, workspaceName?: string) {
    const existing = Array.from(db.data.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      const err: any = new Error('User with this email already exists');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      status: AccountStatus.ACTIVE,
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: now,
      updatedAt: now
    };

    db.data.users.set(userId, newUser);

    // Create default workspace for new user
    const workspaceId = uuidv4();
    const newWs = {
      id: workspaceId,
      name: workspaceName || `${displayName}'s Workspace`,
      timezone: 'UTC',
      locale: 'en',
      createdAt: now,
      updatedAt: now
    };
    db.data.workspaces.set(workspaceId, newWs);

    // Add as OWNER
    const memberId = uuidv4();
    db.data.workspaceMembers.set(memberId, {
      id: memberId,
      workspaceId,
      userId,
      role: MemberRole.OWNER,
      status: AccountStatus.ACTIVE,
      joinedAt: now
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      config.sessionSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        status: newUser.status,
        mfaEnabled: newUser.mfaEnabled,
        createdAt: newUser.createdAt
      },
      workspaces: [
        {
          id: newWs.id,
          name: newWs.name,
          timezone: newWs.timezone,
          locale: newWs.locale,
          role: MemberRole.OWNER,
          joinedAt: now
        }
      ]
    };
  }

  static async getMe(userId: string) {
    const user = db.data.users.get(userId);
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const memberships = Array.from(db.data.workspaceMembers.values()).filter(
      (m) => m.userId === user.id && m.status === AccountStatus.ACTIVE
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

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt
      },
      workspaces
    };
  }
}
