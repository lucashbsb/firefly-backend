import { BaseRepository } from './base';
import { User } from '../models/entities';
import { CreateUserDTO } from '../dto';

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  async create(data: CreateUserDTO & { password_hash: string }): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO users (email, name, password_hash, native_language, target_level, current_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        data.email,
        data.name,
        data.password_hash,
        data.native_language || 'pt-BR',
        data.target_level || 'C1',
        data.current_level || 'B1'
      ]
    );
    return result.rows[0].id;
  }

  async findByEmail(email: string): Promise<(User & { password_hash?: string }) | null> {
    const result = await this.query<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async updateLevel(userId: string, level: string, perceived?: string): Promise<void> {
    await this.query(
      'UPDATE users SET current_level = $1, perceived_level = $2, updated_at = NOW() WHERE id = $3',
      [level, perceived || level, userId]
    );
  }

  async updatePassword(userId: string, hash: string): Promise<void> {
    await this.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, userId]
    );
  }

  async findAllOrdered(): Promise<User[]> {
    const result = await this.query<User>('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async findBasicById(userId: string): Promise<{ id: string; email: string; name: string } | null> {
    const result = await this.query<{ id: string; email: string; name: string }>(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }
}

export const userRepository = new UserRepository();
