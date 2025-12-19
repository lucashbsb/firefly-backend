import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db, closePool } from './postgres';
import * as bcrypt from 'bcryptjs';

interface LegacyExercise {
  day: number;
  topic: string;
  phase: number;
  level: string;
  grammar_focus: string[];
  vocabulary_focus: string[];
  theory: string;
  exercises: Array<{
    id: number;
    type: string;
    question: string;
    correct_answer: string;
    instruction?: string;
    hint?: string;
    explanation?: string;
    targets_weakness?: string;
    skill_tags?: string[];
    difficulty?: number;
  }>;
}

interface LegacyAnswer {
  day: number;
  timestamp: number;
  answers: Array<{
    question: string;
    student_answer: string;
  }>;
}

interface LegacyReport {
  day: number;
  timestamp: number;
  topic: string;
  phase: number;
  level: string;
  grammar_focus: string[];
  vocabulary_focus: string[];
  performance_score: number;
  accuracy_rate: number;
  exercises_correct: number;
  exercises_partially_correct?: number;
  exercises_wrong: number;
  exercises_blank?: number;
  exercises_total: number;
  detailed_corrections: Array<{
    id: number;
    type: string;
    question: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    feedback: string | null;
    error_type: string | null;
  }>;
  strengths?: string[];
  weaknesses?: string[];
  recurring_mistakes?: string[];
  conversation_summary?: string;
  next_steps?: string[];
  motivational_note?: string;
}

async function importLegacyData(): Promise<void> {
  const dataDir = join(__dirname, '../../../data');
  
  console.log('Starting legacy data import...\n');

  const userId = await ensureAdminUser();
  console.log(`✓ Admin user ready: ${userId}\n`);

  await importExercises(dataDir, userId);
  await importReports(dataDir, userId);

  console.log('\n✓ Import complete!');
}

async function ensureAdminUser(): Promise<string> {
  const email = 'heliobsb.almeida@icloud.com';
  
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash('Q@z12345', 10);
  
  const userResult = await db.query(
    `INSERT INTO users (email, password_hash, name, native_language, current_level, target_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [email, passwordHash, 'Lucas', 'pt-BR', 'B1', 'C1']
  );

  const userId = userResult.rows[0].id;

  const roleResult = await db.query(
    "SELECT id FROM roles WHERE name = 'admin'"
  );

  if (roleResult.rows.length > 0) {
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleResult.rows[0].id]
    );
  }

  return userId;
}

async function importExercises(dataDir: string, userId: string): Promise<void> {
  const exercisesDir = join(dataDir, 'exercises');
  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.json'));

  console.log(`Importing ${files.length} exercise file(s)...`);

  for (const file of files) {
    const data: LegacyExercise = JSON.parse(
      readFileSync(join(exercisesDir, file), 'utf-8')
    );

    const lessonResult = await db.query(
      `INSERT INTO lessons (day, topic, phase, level, theory, grammar_focus, vocabulary_focus, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, NOW())
       ON CONFLICT (day) DO UPDATE SET
         topic = EXCLUDED.topic,
         phase = EXCLUDED.phase,
         level = EXCLUDED.level,
         theory = EXCLUDED.theory,
         grammar_focus = EXCLUDED.grammar_focus,
         vocabulary_focus = EXCLUDED.vocabulary_focus
       RETURNING id`,
      [
        data.day,
        data.topic,
        data.phase,
        data.level,
        data.theory,
        JSON.stringify(data.grammar_focus),
        JSON.stringify(data.vocabulary_focus)
      ]
    );

    const lessonId = lessonResult.rows[0].id;

    await db.query('DELETE FROM exercises WHERE lesson_id = $1', [lessonId]);

    for (let i = 0; i < data.exercises.length; i++) {
      const ex = data.exercises[i];
      await db.query(
        `INSERT INTO exercises (
          lesson_id, position, type, question, correct_answer, 
          hint, explanation, skill_tags, difficulty
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
        [
          lessonId,
          i + 1,
          ex.type,
          ex.question,
          ex.correct_answer,
          ex.hint || null,
          ex.explanation || null,
          JSON.stringify(ex.skill_tags || []),
          ex.difficulty || 1
        ]
      );
    }

    console.log(`  ✓ Day ${data.day}: ${data.exercises.length} exercises`);
  }
}

async function importReports(dataDir: string, userId: string): Promise<void> {
  const reportsDir = join(dataDir, 'reports');
  const files = readdirSync(reportsDir)
    .filter(f => f.startsWith('day-') && f.endsWith('.json'))
    .sort();

  console.log(`\nImporting ${files.length} report(s)...`);

  for (const file of files) {
    const data: LegacyReport = JSON.parse(
      readFileSync(join(reportsDir, file), 'utf-8')
    );

    const lessonResult = await db.query(
      'SELECT id FROM lessons WHERE day = $1',
      [data.day]
    );

    const lessonId = lessonResult.rows.length > 0 ? lessonResult.rows[0].id : null;

    const errorBreakdown: Record<string, number> = {};
    data.detailed_corrections.forEach(c => {
      if (!c.is_correct && c.error_type) {
        errorBreakdown[c.error_type] = (errorBreakdown[c.error_type] || 0) + 1;
      }
    });

    await db.query(
      `INSERT INTO daily_reports (
        user_id, lesson_id, day, 
        performance_score, accuracy_rate,
        exercises_correct, exercises_total,
        strengths, weaknesses, error_breakdown,
        conversation_notes, next_day_focus, motivational_note,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12::jsonb, $13, $14)
      ON CONFLICT (user_id, day) DO UPDATE SET
        performance_score = EXCLUDED.performance_score,
        accuracy_rate = EXCLUDED.accuracy_rate,
        exercises_correct = EXCLUDED.exercises_correct,
        exercises_total = EXCLUDED.exercises_total,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        error_breakdown = EXCLUDED.error_breakdown`,
      [
        userId,
        lessonId,
        data.day,
        data.performance_score,
        data.accuracy_rate,
        data.exercises_correct,
        data.exercises_total,
        JSON.stringify(data.strengths || []),
        JSON.stringify(data.weaknesses || []),
        JSON.stringify(errorBreakdown),
        data.conversation_summary || null,
        JSON.stringify(data.next_steps || []),
        data.motivational_note || null,
        new Date(data.timestamp)
      ]
    );

    console.log(`  ✓ Day ${data.day}: ${data.performance_score}% performance`);
  }
}

importLegacyData()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
