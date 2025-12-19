import { QueryResultRow } from 'pg';
import * as postgres from './postgres';

export interface QueryResult<T> {
  rows: T[];
  rowCount: number | null;
}

export interface DatabaseClient {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface TransactionClient {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

class PostgresDatabase implements DatabaseClient {
  async query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    const result = await postgres.query<T>(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  async transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
    return postgres.transaction(async (pgClient) => {
      const client: TransactionClient = {
        async query<R extends QueryResultRow>(text: string, params?: unknown[]) {
          const result = await pgClient.query<R>(text, params);
          return { rows: result.rows, rowCount: result.rowCount };
        }
      };
      return callback(client);
    });
  }

  async close(): Promise<void> {
    await postgres.closePool();
  }
}

export const db: DatabaseClient = new PostgresDatabase();
