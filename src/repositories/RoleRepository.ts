import { BaseRepository } from './base';
import { Role } from '../models/entities';
import { CreateRoleDTO } from '../dto';

export class RoleRepository extends BaseRepository<Role> {
  protected tableName = 'roles';

  async findByName(name: string): Promise<Role | null> {
    const result = await this.query<Role>('SELECT * FROM roles WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  async findAllOrdered(): Promise<Role[]> {
    const result = await this.query<Role>('SELECT * FROM roles ORDER BY name');
    return result.rows;
  }

  async create(data: CreateRoleDTO): Promise<Role> {
    const result = await this.query<Role>(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description || null]
    );
    return result.rows[0];
  }
}

export const roleRepository = new RoleRepository();
