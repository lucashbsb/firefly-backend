import { BaseRepository } from './base';
import { UserRole, Role } from '../models/entities';

export class UserRoleRepository extends BaseRepository<UserRole> {
  protected tableName = 'user_roles';

  async findByUserId(userId: string): Promise<Role[]> {
    const result = await this.query<Role>(
      `SELECT r.* FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async findPermissionsByUserId(userId: string): Promise<string[]> {
    const result = await this.query<{ code: string }>(
      `SELECT DISTINCT p.code FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows.map(r => r.code);
  }

  async assign(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    const result = await this.query<UserRole>(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) RETURNING *',
      [userId, roleId, assignedBy || null]
    );
    return result.rows[0];
  }

  async remove(userId: string, roleId: string): Promise<void> {
    await this.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
  }
}

export const userRoleRepository = new UserRoleRepository();
