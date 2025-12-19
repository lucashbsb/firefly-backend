import { readFileSync } from 'fs'
import { join } from 'path'
import { db, closePool } from './postgres'
import { logger } from '../lib/logger'

interface SkillData {
  code: string
  name: string
  description: string
  category: string
  level_min: string
}

async function seedSkills(): Promise<void> {
  const levels = ['a1', 'a2', 'b1', 'b2', 'c1']
  const skillsDir = join(__dirname, '../../../skills')

  let totalInserted = 0
  let totalSkipped = 0

  for (const level of levels) {
    const filePath = join(skillsDir, `${level}.json`)
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as SkillData[]

    for (const skill of data) {
      const result = await db.query(
        `INSERT INTO skills (code, name, level, category, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [skill.code, skill.name, skill.level_min.toUpperCase(), skill.category, skill.description]
      )

      if (result.rowCount && result.rowCount > 0) {
        totalInserted++
      } else {
        totalSkipped++
      }
    }

    logger.info({ level: level.toUpperCase(), count: data.length }, 'Skills processed')
  }

  logger.info({ inserted: totalInserted, skipped: totalSkipped }, 'Skills seed complete')
}

seedSkills()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.fatal({ err }, 'Skills seed failed')
    process.exit(1)
  })
