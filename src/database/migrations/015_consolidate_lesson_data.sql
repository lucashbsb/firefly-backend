ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS exercises_data JSONB DEFAULT NULL;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS chat_messages JSONB DEFAULT '[]'::jsonb;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS report JSONB DEFAULT NULL;

drop table exercises;

drop table user_answers;