import fs from 'fs';
import path from 'path';
import { getPool } from '../postgres';

interface SkillData {
  code: string;
  name: string;
  description: string;
  category: string;
  track: string;
  level_min: string;
  level_max: string;
  importance_weight: number;
  difficulty_weight: number;
  examples: string[];
  dependencies: string[];
}

async function seedSkills(): Promise<void> {
  const skillsDir = path.join(__dirname, '../../../data/skills');
  const files = ['a1.json', 'a2.json', 'b1.json', 'b2.json', 'c1.json'];

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS curriculum_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        track TEXT NOT NULL,
        level_min TEXT NOT NULL,
        level_max TEXT NOT NULL,
        importance_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        difficulty_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        examples JSONB NOT NULL DEFAULT '[]',
        dependencies JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query('DELETE FROM curriculum_skills');

    let totalSkills = 0;

    for (const file of files) {
      const filePath = path.join(skillsDir, file);

      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const skills: SkillData[] = Array.isArray(data) ? data : (data.skills || []);

      for (const skill of skills) {
        await client.query(
          `INSERT INTO curriculum_skills 
            (code, name, description, category, track, level_min, level_max, importance_weight, difficulty_weight, examples, dependencies)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (code) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             track = EXCLUDED.track,
             level_min = EXCLUDED.level_min,
             level_max = EXCLUDED.level_max,
             importance_weight = EXCLUDED.importance_weight,
             difficulty_weight = EXCLUDED.difficulty_weight,
             examples = EXCLUDED.examples,
             dependencies = EXCLUDED.dependencies`,
          [
            skill.code,
            skill.name,
            skill.description,
            skill.category,
            skill.track,
            skill.level_min,
            skill.level_max,
            skill.importance_weight,
            skill.difficulty_weight,
            JSON.stringify(skill.examples || []),
            JSON.stringify(skill.dependencies || []),
          ]
        );
        totalSkills++;
      }

      console.log(`Loaded ${skills.length} skills from ${file}`);
    }

    await client.query('COMMIT');
    console.log(`Total skills seeded: ${totalSkills}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding skills:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedSkills()
  .then(() => {
    console.log('Skills seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed skills:', error);
    process.exit(1);
  });
