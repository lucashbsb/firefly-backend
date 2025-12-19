-- ============================================================================
-- MIGRATION 017: SCHEMA RESTRUCTURE
-- Simplifies the database by consolidating lesson data and cleaning up unused tables
-- ============================================================================

-- ============================================================================
-- ANALYSIS OF CURRENT TABLES:
--
-- KEEP (core functionality):
-- ✓ users - user accounts
-- ✓ user_settings - user preferences
-- ✓ user_streaks - streak tracking
-- ✓ lessons - consolidated lesson data (exercises, corrections, chat, report as JSONB)
-- ✓ skills - skill definitions
-- ✓ user_skills - user skill progress
-- ✓ roles, permissions, role_permissions, user_roles - RBAC
-- ✓ user_ai_settings - AI provider preferences
-- ✓ system_prompts, prompt_types, prompt_templates - AI prompts
-- ✓ ai_prompt_logs - AI usage tracking
-- ✓ sr_cards, sr_card_states, sr_reviews - spaced repetition (future feature)
--
-- DROP (redundant/unused after consolidation):
-- ✗ exercises - consolidated into lessons.exercises_data
-- ✗ user_answers - consolidated into lessons.corrections
-- ✗ lesson_chat_messages - consolidated into lessons.chat_messages
-- ✗ daily_reports - consolidated into lessons.report
-- ✗ user_lesson_progress - redundant with lessons (user_id, day, status)
-- ✗ user_conversations - redundant with lessons.chat_messages
-- ✗ lesson_content_log - metadata can be in lessons
-- ✗ user_learning_metrics - can be derived from lessons
-- ✗ user_level_progression - perceived_level stored in daily lessons
-- ✗ user_error_log - errors in corrections JSONB
-- ✗ user_curriculum_progress - overkill, skills table is enough
-- ✗ user_vocabulary_log - overkill for MVP
-- ✗ user_session_analytics - overkill for MVP
--
-- NEW:
-- + lesson_summary - lightweight table for fast listing
-- ============================================================================

-- ============================================================================
-- 1. CREATE LESSON SUMMARY TABLE (for fast listing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    lesson_id UUID NOT NULL UNIQUE REFERENCES lessons (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    topic TEXT NOT NULL,
    level TEXT NOT NULL,
    phase INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'created',
    exercises_total INTEGER NOT NULL DEFAULT 30,
    exercises_answered INTEGER NOT NULL DEFAULT 0,
    exercises_correct INTEGER NOT NULL DEFAULT 0,
    exercises_partial INTEGER NOT NULL DEFAULT 0,
    exercises_wrong INTEGER NOT NULL DEFAULT 0,
    chat_total INTEGER NOT NULL DEFAULT 3,
    chat_answered INTEGER NOT NULL DEFAULT 0,
    accuracy_rate NUMERIC(5, 2) DEFAULT 0,
    performance_score NUMERIC(5, 2) DEFAULT 0,
    perceived_level TEXT,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, day)
);

CREATE INDEX idx_lesson_summary_user ON lesson_summary (user_id);

CREATE INDEX idx_lesson_summary_user_day ON lesson_summary (user_id, day DESC);

CREATE INDEX idx_lesson_summary_status ON lesson_summary (status);

-- ============================================================================
-- 2. POPULATE LESSON SUMMARY FROM EXISTING LESSONS
-- ============================================================================
INSERT INTO
    lesson_summary (
        lesson_id,
        user_id,
        day,
        topic,
        level,
        phase,
        status,
        exercises_total,
        exercises_answered,
        exercises_correct,
        exercises_partial,
        exercises_wrong,
        chat_total,
        chat_answered,
        accuracy_rate,
        performance_score,
        perceived_level,
        started_at,
        completed_at,
        created_at
    )
SELECT
    l.id as lesson_id,
    l.user_id,
    l.day,
    l.topic,
    l.level,
    l.phase,
    l.status::text,
    COALESCE(l.exercises_total, 30) as exercises_total,
    COALESCE(l.exercises_answered, 0) as exercises_answered,
    COALESCE(
        (
            l.corrections -> 'summary' ->> 'correct'
        )::integer,
        0
    ) as exercises_correct,
    COALESCE(
        (
            l.corrections -> 'summary' ->> 'partial'
        )::integer,
        0
    ) as exercises_partial,
    COALESCE(
        (
            l.corrections -> 'summary' ->> 'wrong'
        )::integer,
        0
    ) as exercises_wrong,
    COALESCE(l.chat_questions_total, 3) as chat_total,
    COALESCE(l.chat_questions_answered, 0) as chat_answered,
    COALESCE(
        (
            l.corrections -> 'summary' ->> 'accuracy_rate'
        )::numeric,
        0
    ) as accuracy_rate,
    COALESCE(
        (
            l.report ->> 'performance_score'
        )::numeric,
        0
    ) as performance_score,
    l.report ->> 'perceived_level' as perceived_level,
    l.created_at as started_at,
    CASE
        WHEN l.status = 'completed' THEN l.created_at + interval '1 hour'
        ELSE NULL
    END as completed_at,
    l.created_at
FROM lessons l
WHERE
    l.user_id IS NOT NULL
ON CONFLICT (user_id, day) DO NOTHING;

-- ============================================================================
-- 3. CREATE FUNCTION TO SYNC LESSON SUMMARY
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_lesson_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_exercises_correct INTEGER;
    v_exercises_partial INTEGER;
    v_exercises_wrong INTEGER;
    v_accuracy_rate NUMERIC(5,2);
    v_performance_score NUMERIC(5,2);
    v_perceived_level TEXT;
    v_chat_answered INTEGER;
BEGIN
    v_exercises_correct := COALESCE((NEW.corrections->'summary'->>'correct')::integer, 0);
    v_exercises_partial := COALESCE((NEW.corrections->'summary'->>'partial')::integer, 0);
    v_exercises_wrong := COALESCE((NEW.corrections->'summary'->>'wrong')::integer, 0);
    v_accuracy_rate := COALESCE((NEW.corrections->'summary'->>'accuracy_rate')::numeric, 0);
    v_performance_score := COALESCE((NEW.report->>'performance_score')::numeric, 0);
    v_perceived_level := NEW.report->'perceived_level'->>'overall';
    v_chat_answered := COALESCE(jsonb_array_length(
        COALESCE(NEW.chat_messages, '[]'::jsonb)
    ) / 2, 0);

    INSERT INTO lesson_summary (
        lesson_id, user_id, day, topic, level, phase, status,
        exercises_total, exercises_answered, exercises_correct, exercises_partial, exercises_wrong,
        chat_total, chat_answered, accuracy_rate, performance_score, perceived_level,
        started_at, completed_at, updated_at
    ) VALUES (
        NEW.id, NEW.user_id, NEW.day, NEW.topic, NEW.level, NEW.phase, NEW.status::text,
        COALESCE(NEW.exercises_total, 30),
        COALESCE(NEW.exercises_answered, 0),
        v_exercises_correct,
        v_exercises_partial,
        v_exercises_wrong,
        COALESCE(NEW.chat_questions_total, 3),
        v_chat_answered,
        v_accuracy_rate,
        v_performance_score,
        v_perceived_level,
        CASE WHEN NEW.status != 'created' THEN COALESCE(NEW.created_at, NOW()) ELSE NULL END,
        CASE WHEN NEW.status = 'completed' THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (lesson_id) DO UPDATE SET
        status = EXCLUDED.status,
        exercises_answered = EXCLUDED.exercises_answered,
        exercises_correct = EXCLUDED.exercises_correct,
        exercises_partial = EXCLUDED.exercises_partial,
        exercises_wrong = EXCLUDED.exercises_wrong,
        chat_answered = EXCLUDED.chat_answered,
        accuracy_rate = EXCLUDED.accuracy_rate,
        performance_score = EXCLUDED.performance_score,
        perceived_level = EXCLUDED.perceived_level,
        started_at = COALESCE(lesson_summary.started_at, EXCLUDED.started_at),
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lesson_summary ON lessons;

CREATE TRIGGER trg_sync_lesson_summary
    AFTER INSERT OR UPDATE ON lessons
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION sync_lesson_summary();

-- ============================================================================
-- 4. CREATE FUNCTION TO UPDATE USER PROGRESS AFTER LESSON COMPLETE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_after_lesson_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE users SET
            current_day = GREATEST(current_day, NEW.day + 1),
            perceived_level = COALESCE(NEW.report->'perceived_level'->>'overall', perceived_level),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        UPDATE user_streaks SET
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_study_date = CURRENT_DATE
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_after_lesson ON lessons;

CREATE TRIGGER trg_update_user_after_lesson
    AFTER UPDATE ON lessons
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION update_user_after_lesson_complete();

-- ============================================================================
-- 5. DROP REDUNDANT TABLES
-- ============================================================================

DROP TABLE IF EXISTS user_session_analytics CASCADE;

DROP TABLE IF EXISTS user_vocabulary_log CASCADE;

DROP TABLE IF EXISTS user_curriculum_progress CASCADE;

DROP TABLE IF EXISTS user_error_log CASCADE;

DROP TABLE IF EXISTS user_level_progression CASCADE;

DROP TABLE IF EXISTS user_learning_metrics CASCADE;

DROP TABLE IF EXISTS lesson_content_log CASCADE;

DROP TABLE IF EXISTS user_conversations CASCADE;

DROP TABLE IF EXISTS daily_reports CASCADE;

DROP TABLE IF EXISTS lesson_chat_messages CASCADE;

DROP TABLE IF EXISTS user_lesson_progress CASCADE;

-- Tables already dropped in migration 015:
-- DROP TABLE IF EXISTS exercises CASCADE;
-- DROP TABLE IF EXISTS user_answers CASCADE;

-- ============================================================================
-- 6. DROP REDUNDANT VIEWS
-- ============================================================================

DROP VIEW IF EXISTS user_metrics_summary CASCADE;

DROP VIEW IF EXISTS user_weekly_progress CASCADE;

DROP VIEW IF EXISTS lesson_history_view CASCADE;

-- ============================================================================
-- 7. CREATE USEFUL VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW user_progress_view AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    u.current_day,
    u.current_level,
    u.perceived_level,
    us.current_streak,
    us.longest_streak,
    us.last_study_date,
    (
        SELECT COUNT(*)
        FROM lesson_summary ls
        WHERE
            ls.user_id = u.id
            AND ls.status = 'completed'
    ) as lessons_completed,
    (
        SELECT COALESCE(AVG(ls.accuracy_rate), 0)
        FROM lesson_summary ls
        WHERE
            ls.user_id = u.id
            AND ls.status = 'completed'
    ) as avg_accuracy,
    (
        SELECT COALESCE(AVG(ls.performance_score), 0)
        FROM lesson_summary ls
        WHERE
            ls.user_id = u.id
            AND ls.status = 'completed'
    ) as avg_performance,
    (
        SELECT COUNT(*)
        FROM user_skills usk
        WHERE
            usk.user_id = u.id
            AND usk.mastery_level >= 80
    ) as skills_mastered,
    (
        SELECT COUNT(*)
        FROM user_skills usk
        WHERE
            usk.user_id = u.id
    ) as skills_total
FROM users u
    LEFT JOIN user_streaks us ON us.user_id = u.id;

CREATE OR REPLACE VIEW lesson_list_view AS
SELECT
    ls.lesson_id,
    ls.user_id,
    ls.day,
    ls.topic,
    ls.level,
    ls.phase,
    ls.status,
    ls.exercises_total,
    ls.exercises_answered,
    ls.exercises_correct,
    ls.accuracy_rate,
    ls.performance_score,
    ls.perceived_level,
    ls.started_at,
    ls.completed_at,
    ls.created_at
FROM lesson_summary ls
ORDER BY ls.day DESC;

-- ============================================================================
-- 8. ADD MISSING COLUMNS TO LESSONS IF NOT EXISTS
-- ============================================================================

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 9. CREATE UPDATED_AT TRIGGER FOR LESSONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON lessons;

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_lessons_updated_at();

-- ============================================================================
-- FINAL SCHEMA SUMMARY:
--
-- Core Tables:
-- - users: User accounts with current_day, current_level, perceived_level
-- - user_settings: User preferences
-- - user_streaks: Streak tracking
-- - lessons: All lesson data (JSONB: exercises_data, corrections, chat_messages, report)
-- - lesson_summary: Lightweight listing table (auto-synced via trigger)
-- - skills: Skill definitions
-- - user_skills: User skill progress
--
-- Auth/RBAC:
-- - roles, permissions, role_permissions, user_roles
--
-- AI:
-- - user_ai_settings: AI provider preferences
-- - system_prompts, prompt_types, prompt_templates: AI prompts
-- - ai_prompt_logs: Usage tracking
--
-- Spaced Repetition (future):
-- - sr_cards, sr_card_states, sr_reviews
--
-- Data Flow:
-- 1. User starts lesson → creates row in lessons (status: created)
-- 2. User answers exercises → updates exercises_data JSONB
-- 3. AI corrects → updates corrections JSONB, triggers summary sync
-- 4. Chat practice → updates chat_messages JSONB
-- 5. Report generated → updates report JSONB
-- 6. Lesson completes → triggers user progress update
-- ============================================================================