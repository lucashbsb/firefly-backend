import { db, QueryResult, TransactionClient } from '../../database/db';
import { QueryResultRow } from 'pg';

export abstract class BaseRepository<T extends QueryResultRow> {
  protected abstract tableName: string;

  protected async query<R extends QueryResultRow = T>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>> {
    return db.query<R>(text, params);
  }

  protected async transaction<R>(
    callback: (client: TransactionClient) => Promise<R>
  ): Promise<R> {
    return db.transaction(callback);
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<T[]> {
    const result = await this.query<T>(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1) as exists`,
      [id]
    );
    return result.rows[0]?.exists ?? false;
  }

  async count(): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}
