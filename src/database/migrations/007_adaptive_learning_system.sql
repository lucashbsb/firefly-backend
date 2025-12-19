-- ============================================================================
-- MIGRATION 007: ADAPTIVE LEARNING SYSTEM
-- Complete system for AI-driven adaptive learning with metrics tracking
-- ============================================================================

-- ============================================================================
-- 1. PROMPT TYPES TABLE - Different system prompts for different contexts
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    prompt_types (code, name, description)
VALUES (
        'lesson',
        'Lesson Generation',
        'System prompt for generating daily lessons'
    ),
    (
        'correction',
        'Answer Correction',
        'System prompt for correcting user answers'
    ),
    (
        'report',
        'Report Generation',
        'System prompt for generating daily reports'
    ),
    (
        'conversation',
        'Conversation',
        'System prompt for conversation practice'
    )
ON CONFLICT (code) DO NOTHING;

-- Update system_prompts to reference prompt_type
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS prompt_type_id UUID REFERENCES prompt_types (id);

ALTER TABLE system_prompts
DROP CONSTRAINT IF EXISTS system_prompts_name_key;

ALTER TABLE system_prompts
ADD CONSTRAINT system_prompts_name_type_unique UNIQUE (name, prompt_type_id);

-- ============================================================================
-- 2. LESSON CONTENT LOG - What was taught each day
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_content_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    skills_taught JSONB NOT NULL DEFAULT '[]',
    skills_practiced JSONB NOT NULL DEFAULT '[]',
    skills_introduced JSONB NOT NULL DEFAULT '[]',
    exercise_types JSONB NOT NULL DEFAULT '{}',
    exercise_count INTEGER NOT NULL DEFAULT 30,
    theory_topics JSONB NOT NULL DEFAULT '[]',
    vocabulary_introduced JSONB NOT NULL DEFAULT '[]',
    grammar_focus JSONB NOT NULL DEFAULT '[]',
    ai_model TEXT,
    ai_provider TEXT,
    generation_tokens INTEGER,
    generation_time_ms INTEGER,
    ai_recommendations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, day)
);

CREATE INDEX idx_lesson_content_log_user_day ON lesson_content_log (user_id, day DESC);

-- ============================================================================
-- 3. ENHANCED USER SKILLS - Add error patterns and detailed tracking
-- ============================================================================
ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS error_patterns JSONB DEFAULT '[]';

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS weak_areas JSONB DEFAULT '[]';

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS strength_areas JSONB DEFAULT '[]';

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS consecutive_correct INTEGER DEFAULT 0;

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS consecutive_errors INTEGER DEFAULT 0;

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS avg_response_time_ms INTEGER;

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS first_introduced_day INTEGER;

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'learning' CHECK (
    status IN (
        'not_started',
        'learning',
        'practicing',
        'mastered',
        'needs_review'
    )
);

-- ============================================================================
-- 4. USER LEARNING METRICS - Comprehensive metrics tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_learning_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

-- Daily metrics
study_time_minutes INTEGER DEFAULT 0,
exercises_attempted INTEGER DEFAULT 0,
exercises_correct INTEGER DEFAULT 0,
exercises_partial INTEGER DEFAULT 0,
exercises_wrong INTEGER DEFAULT 0,

-- Performance
accuracy_rate NUMERIC(5, 2) DEFAULT 0,
avg_response_time_ms INTEGER,
fastest_response_ms INTEGER,
slowest_response_ms INTEGER,

-- Skills
skills_practiced INTEGER DEFAULT 0,
skills_mastered INTEGER DEFAULT 0,
skills_regressed INTEGER DEFAULT 0,
new_skills_introduced INTEGER DEFAULT 0,

-- Vocabulary
vocabulary_learned INTEGER DEFAULT 0,
vocabulary_reviewed INTEGER DEFAULT 0,

-- Conversation
conversation_turns INTEGER DEFAULT 0,
conversation_errors INTEGER DEFAULT 0,

-- Engagement
hints_used INTEGER DEFAULT 0,
    explanations_viewed INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE INDEX idx_user_learning_metrics_user_date ON user_learning_metrics (user_id, date DESC);

-- ============================================================================
-- 5. USER LEVEL PROGRESSION - Track level changes over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_level_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    perceived_level TEXT NOT NULL,
    confidence_score NUMERIC(5, 2),
    grammar_level TEXT,
    vocabulary_level TEXT,
    fluency_level TEXT,
    listening_level TEXT,
    reading_level TEXT,
    writing_level TEXT,
    speaking_level TEXT,
    level_breakdown JSONB DEFAULT '{}',
    assessment_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, day)
);

CREATE INDEX idx_user_level_progression_user ON user_level_progression (user_id, day DESC);

-- ============================================================================
-- 6. ERROR TRACKING - Detailed error analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    skill_id UUID REFERENCES skills (id) ON DELETE SET NULL,
    exercise_type TEXT,
    error_type TEXT NOT NULL,
    error_category TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    context TEXT,
    is_recurring BOOLEAN DEFAULT false,
    occurrence_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_error_log_user ON user_error_log (user_id, day DESC);

CREATE INDEX idx_user_error_log_type ON user_error_log (error_type);

CREATE INDEX idx_user_error_log_skill ON user_error_log (skill_id);

-- ============================================================================
-- 7. CURRICULUM PROGRESS - Track which curriculum items were covered
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_curriculum_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    curriculum_item_code TEXT NOT NULL,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (
        status IN (
            'not_started',
            'introduced',
            'practicing',
            'mastered'
        )
    ),
    first_seen_day INTEGER,
    mastered_day INTEGER,
    practice_count INTEGER DEFAULT 0,
    mastery_score NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, curriculum_item_code)
);

CREATE INDEX idx_user_curriculum_progress_user ON user_curriculum_progress (user_id);

CREATE INDEX idx_user_curriculum_progress_status ON user_curriculum_progress (status);

-- ============================================================================
-- 8. VOCABULARY LOG - Track vocabulary learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_vocabulary_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT,
    example_sentence TEXT,
    context TEXT,
    category TEXT,
    level TEXT,
    first_seen_day INTEGER,
    times_seen INTEGER DEFAULT 1,
    times_correct INTEGER DEFAULT 0,
    times_wrong INTEGER DEFAULT 0,
    mastery_score NUMERIC(5, 2) DEFAULT 0,
    status TEXT DEFAULT 'learning' CHECK (
        status IN (
            'new',
            'learning',
            'known',
            'mastered'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, word)
);

CREATE INDEX idx_user_vocabulary_log_user ON user_vocabulary_log (user_id);

CREATE INDEX idx_user_vocabulary_log_status ON user_vocabulary_log (status);

-- ============================================================================
-- 9. SESSION ANALYTICS - Track learning sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    duration_minutes INTEGER,

-- Lesson phase timings
theory_time_seconds INTEGER DEFAULT 0,
exercises_time_seconds INTEGER DEFAULT 0,
conversation_time_seconds INTEGER DEFAULT 0,
review_time_seconds INTEGER DEFAULT 0,

-- Interactions
total_interactions INTEGER DEFAULT 0,
exercises_started INTEGER DEFAULT 0,
exercises_completed INTEGER DEFAULT 0,
exercises_skipped INTEGER DEFAULT 0,

-- Device/context
device_type TEXT,
    browser TEXT,
    timezone TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_session_analytics_user ON user_session_analytics (user_id, day DESC);

-- ============================================================================
-- 10. AGGREGATED METRICS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW user_metrics_summary AS
SELECT u.id as user_id, u.email, u.name, u.current_day, u.current_level, u.perceived_level, u.current_streak,

-- Total metrics
COALESCE(SUM(m.study_time_minutes), 0) as total_study_minutes,
COALESCE(SUM(m.exercises_attempted), 0) as total_exercises_attempted,
COALESCE(SUM(m.exercises_correct), 0) as total_exercises_correct,
COALESCE(
    ROUND(AVG(m.accuracy_rate), 2),
    0
) as avg_accuracy_rate,

-- Skill counts
(
    SELECT COUNT(*)
    FROM user_skills us
    WHERE
        us.user_id = u.id
        AND us.status = 'mastered'
) as skills_mastered,
(
    SELECT COUNT(*)
    FROM user_skills us
    WHERE
        us.user_id = u.id
        AND us.status = 'learning'
) as skills_learning,
(
    SELECT COUNT(*)
    FROM user_skills us
    WHERE
        us.user_id = u.id
        AND us.status = 'needs_review'
) as skills_needs_review,

-- Vocabulary
(
    SELECT COUNT(*)
    FROM user_vocabulary_log v
    WHERE
        v.user_id = u.id
        AND v.status = 'mastered'
) as vocabulary_mastered,
(
    SELECT COUNT(*)
    FROM user_vocabulary_log v
    WHERE
        v.user_id = u.id
) as vocabulary_total,

-- Streak info
us.longest_streak, us.last_study_date,

-- Days active
(
    SELECT COUNT(DISTINCT date)
    FROM user_learning_metrics m2
    WHERE
        m2.user_id = u.id
) as days_active
FROM
    users u
    LEFT JOIN user_learning_metrics m ON m.user_id = u.id
    LEFT JOIN user_streaks us ON us.user_id = u.id
GROUP BY
    u.id,
    u.email,
    u.name,
    u.current_day,
    u.current_level,
    u.perceived_level,
    u.current_streak,
    us.longest_streak,
    us.last_study_date;

-- ============================================================================
-- 11. WEEKLY PROGRESS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW user_weekly_progress AS
SELECT
    user_id,
    DATE_TRUNC('week', date) as week_start,
    SUM(study_time_minutes) as weekly_study_minutes,
    SUM(exercises_attempted) as weekly_exercises,
    SUM(exercises_correct) as weekly_correct,
    ROUND(AVG(accuracy_rate), 2) as weekly_accuracy,
    SUM(skills_mastered) as skills_mastered_this_week,
    SUM(vocabulary_learned) as vocabulary_this_week,
    COUNT(DISTINCT date) as days_studied
FROM user_learning_metrics
GROUP BY
    user_id,
    DATE_TRUNC('week', date)
ORDER BY user_id, week_start DESC;