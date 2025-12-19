-- Migration: Lesson Workflow
-- Adds lesson status tracking and chat questions

CREATE TYPE lesson_status AS ENUM (
    'created',
    'in_progress',
    'exercises_completed',
    'corrected',
    'chat_in_progress',
    'chat_completed',
    'completed'
);

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS status lesson_status DEFAULT 'created';

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id);

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS exercises_answered INTEGER DEFAULT 0;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS exercises_total INTEGER DEFAULT 30;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS chat_questions_answered INTEGER DEFAULT 0;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS chat_questions_total INTEGER DEFAULT 3;

CREATE TABLE IF NOT EXISTS lesson_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (
        role IN ('system', 'assistant', 'user')
    ),
    content TEXT NOT NULL,
    question_number INTEGER,
    is_user_response BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_chat_lesson ON lesson_chat_messages (lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_chat_user ON lesson_chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_lessons_user_status ON lessons (user_id, status);