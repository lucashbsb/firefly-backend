import { BaseRepository } from './base';
import { Permission } from '../models/entities';
import { CreatePermissionDTO } from '../dto';

export class PermissionRepository extends BaseRepository<Permission> {
  protected tableName = 'permissions';

  async findByCode(code: string): Promise<Permission | null> {
    const result = await this.query<Permission>('SELECT * FROM permissions WHERE code = $1', [code]);
    return result.rows[0] || null;
  }

  async findAllOrdered(): Promise<Permission[]> {
    const result = await this.query<Permission>('SELECT * FROM permissions ORDER BY resource, action');
    return result.rows;
  }

  async create(data: CreatePermissionDTO): Promise<Permission> {
    const result = await this.query<Permission>(
      `INSERT INTO permissions (code, name, description, resource, action)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.code, data.name, data.description || null, data.resource, data.action]
    );
    return result.rows[0];
  }
}

export const permissionRepository = new PermissionRepository();
