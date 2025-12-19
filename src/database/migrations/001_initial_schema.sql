CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    native_language TEXT NOT NULL DEFAULT 'pt-BR',
    target_level TEXT NOT NULL DEFAULT 'C1',
    current_level TEXT NOT NULL DEFAULT 'B1',
    perceived_level TEXT DEFAULT 'B1',
    current_day INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    daily_goal_minutes INTEGER NOT NULL DEFAULT 30,
    reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_time TIME DEFAULT '09:00',
    theme TEXT NOT NULL DEFAULT 'dark',
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_study_date DATE,
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    day INTEGER NOT NULL UNIQUE,
    phase INTEGER NOT NULL,
    level TEXT NOT NULL,
    topic TEXT NOT NULL,
    theory TEXT,
    grammar_focus JSONB,
    vocabulary_focus JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    type TEXT NOT NULL,
    question TEXT NOT NULL,
    correct_answer TEXT,
    options JSONB,
    hint TEXT,
    explanation TEXT,
    skill_tags JSONB,
    difficulty INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons (id) ON DELETE SET NULL,
    day INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (
        status IN (
            'not_started',
            'in_progress',
            'completed'
        )
    ),
    score INTEGER,
    correct_count INTEGER,
    total_count INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, day)
);

CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises (id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons (id) ON DELETE SET NULL,
    day INTEGER,
    answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    is_partial BOOLEAN NOT NULL DEFAULT false,
    feedback TEXT,
    error_type TEXT,
    time_spent_seconds INTEGER,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons (id) ON DELETE SET NULL,
    day INTEGER,
    question TEXT NOT NULL,
    student_response TEXT,
    corrected_response TEXT,
    errors JSONB,
    positives JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons (id) ON DELETE SET NULL,
    day INTEGER NOT NULL,
    performance_score INTEGER,
    accuracy_rate INTEGER,
    exercises_correct INTEGER,
    exercises_total INTEGER,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    error_breakdown JSONB DEFAULT '{}',
    skill_scores JSONB DEFAULT '{}',
    conversation_notes TEXT,
    next_day_focus JSONB DEFAULT '[]',
    perceived_level JSONB,
    motivational_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, day)
);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_lessons_day ON lessons (day);

CREATE INDEX idx_exercises_lesson ON exercises (lesson_id);

CREATE INDEX idx_user_answers_user ON user_answers (user_id);

CREATE INDEX idx_user_answers_exercise ON user_answers (exercise_id);

CREATE INDEX idx_daily_reports_user_day ON daily_reports (user_id, day);

CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress (user_id);