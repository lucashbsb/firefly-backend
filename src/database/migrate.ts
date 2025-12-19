import { db } from './postgres';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../lib/logger';

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const result = await db.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
    
    if (result.rows.length > 0) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    try {
      await db.query(sql);
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      logger.info({ migration: file }, 'Migration executed successfully');
    } catch (error) {
      logger.error({ err: error, migration: file }, 'Failed to execute migration');
      throw error;
    }
  }

  logger.info('All migrations completed');
  await db.closePool();
}

runMigrations().catch(err => {
  logger.fatal({ err }, 'Migration failed');
  process.exit(1);
});
