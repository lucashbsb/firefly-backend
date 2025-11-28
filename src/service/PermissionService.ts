import AppError from "../exception/AppError.js";
import { CreatePermissionDto, UpdatePermissionDto } from "../validation/permissions/permission.schema.js";
import permissionRepository from "../repository/PermissionRepository.js";

class PermissionService {
  async createPermission(payload: CreatePermissionDto) {
    const existing = await permissionRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("Permission already exists", 409);
    }
    const permission = await permissionRepository.create(payload);
    return permissionRepository.save(permission);
  }

  async updatePermission(id: string, payload: UpdatePermissionDto) {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    Object.assign(permission, payload);
    return permissionRepository.save(permission);
  }

  async listPermissions() {
    return permissionRepository.listActive();
  }

  async getPermission(id: string) {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    return permission;
  }
}

export default new PermissionService();
