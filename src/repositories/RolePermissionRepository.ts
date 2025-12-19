import { BaseRepository } from './base';
import { Permission } from '../models/entities';

export class RolePermissionRepository extends BaseRepository<{ id: string }> {
  protected tableName = 'role_permissions';

  async findByRoleId(roleId: string): Promise<Permission[]> {
    const result = await this.query<Permission>(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return result.rows;
  }

  async assign(roleId: string, permissionId: string): Promise<void> {
    await this.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [roleId, permissionId]
    );
  }

  async remove(roleId: string, permissionId: string): Promise<void> {
    await this.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    if (permissionIds.length === 0) return;

    const values = permissionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await this.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
      [roleId, ...permissionIds]
    );
  }
}

export const rolePermissionRepository = new RolePermissionRepository();
