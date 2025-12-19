import { BaseRepository } from './base';

export interface PromptTemplate {
  id: string;
  prompt_type_id: string;
  name: string;
  section: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  variables: string[];
  created_at: Date;
  updated_at: Date;
}

export interface PhaseConfig {
  id: number;
  phase: number;
  day_start: number;
  day_end: number;
  level_name: string;
  grammar_target: string;
  explanation_level: string;
  focus: string;
}

export interface CurriculumSkill {
  id: string;
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

class PromptTemplateRepository extends BaseRepository<PromptTemplate> {
  protected tableName = 'prompt_templates';

  async findByName(name: string): Promise<PromptTemplate[]> {
    const result = await this.query<PromptTemplate>(
      `SELECT pt.*, pt.variables::jsonb as variables
       FROM prompt_templates pt
       WHERE pt.name = $1 AND pt.is_active = true
       ORDER BY pt.sort_order ASC`,
      [name]
    );
    return result.rows;
  }

  async findByNameAndSection(name: string, section: string): Promise<PromptTemplate | null> {
    const result = await this.query<PromptTemplate>(
      `SELECT pt.*, pt.variables::jsonb as variables
       FROM prompt_templates pt
       WHERE pt.name = $1 AND pt.section = $2 AND pt.is_active = true`,
      [name, section]
    );
    return result.rows[0] || null;
  }

  async findByTypeCode(typeCode: string): Promise<PromptTemplate[]> {
    const result = await this.query<PromptTemplate>(
      `SELECT pt.*, pt.variables::jsonb as variables
       FROM prompt_templates pt
       JOIN prompt_types ptype ON ptype.id = pt.prompt_type_id
       WHERE ptype.code = $1 AND pt.is_active = true
       ORDER BY pt.name, pt.sort_order ASC`,
      [typeCode]
    );
    return result.rows;
  }
}

class PhaseConfigRepository extends BaseRepository<PhaseConfig> {
  protected tableName = 'phase_configs';

  async findByDay(day: number): Promise<PhaseConfig | null> {
    const result = await this.query<PhaseConfig>(
      `SELECT * FROM phase_configs 
       WHERE day_start <= $1 AND day_end >= $1
       LIMIT 1`,
      [day]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<PhaseConfig[]> {
    const result = await this.query<PhaseConfig>(
      `SELECT * FROM phase_configs ORDER BY phase ASC`
    );
    return result.rows;
  }
}

class CurriculumSkillRepository extends BaseRepository<CurriculumSkill> {
  protected tableName = 'curriculum_skills';

  async findByLevel(level: string): Promise<CurriculumSkill[]> {
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       WHERE level_min <= $1 AND level_max >= $1
       ORDER BY importance_weight DESC, code ASC`,
      [level]
    );
    return result.rows;
  }

  async findByLevelMax(levelMax: string): Promise<CurriculumSkill[]> {
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       WHERE level_max = $1
       ORDER BY category, code ASC`,
      [levelMax]
    );
    return result.rows;
  }

  async findByLevelRange(levels: string[]): Promise<CurriculumSkill[]> {
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       WHERE level_max = ANY($1)
       ORDER BY level_max, category, code ASC`,
      [levels]
    );
    return result.rows;
  }

  async findByCategory(category: string): Promise<CurriculumSkill[]> {
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       WHERE category = $1
       ORDER BY level_min, code ASC`,
      [category]
    );
    return result.rows;
  }

  async findByCodes(codes: string[]): Promise<CurriculumSkill[]> {
    if (codes.length === 0) return [];
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       WHERE code = ANY($1)`,
      [codes]
    );
    return result.rows;
  }

  async findAll(): Promise<CurriculumSkill[]> {
    const result = await this.query<CurriculumSkill>(
      `SELECT *, examples::jsonb as examples, dependencies::jsonb as dependencies
       FROM curriculum_skills 
       ORDER BY level_min, category, code ASC`
    );
    return result.rows;
  }
}

export const promptTemplateRepository = new PromptTemplateRepository();
export const phaseConfigRepository = new PhaseConfigRepository();
export const curriculumSkillRepository = new CurriculumSkillRepository();
