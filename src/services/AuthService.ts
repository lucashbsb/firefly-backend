import {
  roleRepository,
  permissionRepository,
  userRoleRepository,
  rolePermissionRepository,
  userRepository
} from '../repositories';
import { Role, Permission, UserRole } from '../models/entities';
import { UserWithPermissionsDTO, CreateRoleDTO, CreatePermissionDTO } from '../dto';

export class AuthService {
  async getUserPermissions(userId: string): Promise<string[]> {
    return userRoleRepository.findPermissionsByUserId(userId);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    return userRoleRepository.findByUserId(userId);
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }

  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionCodes.some(code => permissions.includes(code));
  }

  async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionCodes.every(code => permissions.includes(code));
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.some(r => r.name === roleName);
  }

  async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin');
  }

  async getUserWithPermissions(userId: string): Promise<UserWithPermissionsDTO | null> {
    const user = await userRepository.findBasicById(userId);
    if (!user) return null;

    const roles = await this.getUserRoles(userId);
    const permissions = await this.getUserPermissions(userId);

    return { ...user, roles, permissions };
  }

  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    return userRoleRepository.assign(userId, roleId, assignedBy);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await userRoleRepository.remove(userId, roleId);
  }

  async getAllRoles(): Promise<Role[]> {
    return roleRepository.findAllOrdered();
  }

  async getAllPermissions(): Promise<Permission[]> {
    return permissionRepository.findAllOrdered();
  }

  async getPermissionsByResource(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();
    return this.groupPermissionsByResource(permissions);
  }

  private groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
    const grouped: Record<string, Permission[]> = {};
    for (const p of permissions) {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p);
    }
    return grouped;
  }

  async createRole(data: CreateRoleDTO): Promise<Role> {
    return roleRepository.create(data);
  }

  async createPermission(data: CreatePermissionDTO): Promise<Permission> {
    return permissionRepository.create(data);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await rolePermissionRepository.assign(roleId, permissionId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await rolePermissionRepository.remove(roleId, permissionId);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return rolePermissionRepository.findByRoleId(roleId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await rolePermissionRepository.setPermissions(roleId, permissionIds);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return roleRepository.findByName(name);
  }

  async assignDefaultRole(userId: string): Promise<void> {
    const studentRole = await this.getRoleByName('student');
    if (studentRole) {
      await this.assignRole(userId, studentRole.id);
    }
  }
}

export const authService = new AuthService();
