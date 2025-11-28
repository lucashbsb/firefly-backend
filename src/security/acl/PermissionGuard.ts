import { NextFunction, Request, Response } from "express";
import AppError from "../../exception/AppError.js";
import userRoleRepository from "../../repository/UserRoleRepository.js";
import { AppDataSource, initializeDataSource } from "../../infrastructure/db/DataSource.js";
import RolePermission from "../../entity/RolePermissionEntity.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userPermissions?: string[];
}

const extractRoleIds = (userRoles: any[]): string[] => {
  return userRoles.map(ur => ur.role.id);
};

const fetchUserPermissions = async (roleIds: string[]): Promise<string[]> => {
  const dataSource = await initializeDataSource();
  const rolePermRepo = dataSource.getRepository(RolePermission);
  
  const rolePermissions = await rolePermRepo.find({
    where: roleIds.map(roleId => ({ role: { id: roleId }, isActive: true })),
    relations: ["permission"]
  });

  return rolePermissions
    .map(rp => rp.permission.code)
    .filter((code, idx, arr) => arr.indexOf(code) === idx);
};

const validatePermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.userId) {
        throw new AppError("Authentication required", 401);
      }

      const userRoles = await userRoleRepository.findByUserId(authReq.userId);
      if (!userRoles.length) {
        throw new AppError("No roles assigned", 403);
      }

      const roleIds = extractRoleIds(userRoles);
      const userPermissionCodes = await fetchUserPermissions(roleIds);
      authReq.userPermissions = userPermissionCodes;

      if (!validatePermissions(userPermissionCodes, requiredPermissions)) {
        throw new AppError("Insufficient permissions", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
