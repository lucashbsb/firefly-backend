import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../lib/logger';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle client');
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const db = {
  query,
  getClient,
  transaction,
  getPool,
  closePool
};
