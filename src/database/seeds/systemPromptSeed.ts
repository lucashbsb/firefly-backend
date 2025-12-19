import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { logger } from '../../lib/logger';

export async function seedSystemPrompts(): Promise<void> {
  const sqlPath = path.join(__dirname, '002_system_prompts_by_type.sql');
  
  if (!fs.existsSync(sqlPath)) {
    logger.warn('Seed file 002_system_prompts_by_type.sql not found, skipping');
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await db.query(sql);
  logger.info('System prompts seeded successfully');
}
