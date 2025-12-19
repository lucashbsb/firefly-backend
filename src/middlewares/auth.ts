import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authService } from '../services/AuthService';
import { PermissionCode } from '../models';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Missing or invalid authorization' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const userWithPermissions = await authService.getUserWithPermissions(decoded.userId);

    if (!userWithPermissions) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles: userWithPermissions.roles.map(r => r.name),
      permissions: userWithPermissions.permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const requirePermission = (...permissions: PermissionCode[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    const hasPermission = permissions.some(p => req.user!.permissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions
      });
      return;
    }

    next();
  };
};

export const requireAllPermissions = (...permissions: PermissionCode[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    const hasAll = permissions.every(p => req.user!.permissions.includes(p));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
        missing: permissions.filter(p => !req.user!.permissions.includes(p))
      });
      return;
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const hasRole = roles.some(r => req.user!.roles.includes(r));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role',
        required: roles
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

export const requireOwnership = (userIdParam = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    const targetUserId = req.params[userIdParam];
    if (req.user.id !== targetUserId) {
      res.status(403).json({ success: false, error: 'Access denied. Resource belongs to another user.' });
      return;
    }

    next();
  };
};

export const requireOwnershipById = (userIdParam = 'id') => {
  return requireOwnership(userIdParam);
};

export const requireOwnerOrPermission = (permission: PermissionCode, userIdParam = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (req.user.roles.includes('admin')) {
      next();
      return;
    }

    const targetUserId = req.params[userIdParam];
    const isOwner = req.user.id === targetUserId;
    const hasPermission = req.user.permissions.includes(permission);

    if (!isOwner && !hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Must be resource owner or have permission.',
        required: permission
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const userWithPermissions = await authService.getUserWithPermissions(decoded.userId);

    if (userWithPermissions) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: userWithPermissions.roles.map(r => r.name),
        permissions: userWithPermissions.permissions
      };
    }

    next();
  } catch {
    next();
  }
};

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
