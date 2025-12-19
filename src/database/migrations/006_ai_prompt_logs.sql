CREATE TABLE IF NOT EXISTS ai_prompt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    messages JSONB NOT NULL,
    temperature NUMERIC,
    max_tokens INTEGER,
    response_content TEXT,
    response_tokens JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_prompt_logs_user_id ON ai_prompt_logs (user_id);

CREATE INDEX idx_ai_prompt_logs_created_at ON ai_prompt_logs (created_at DESC);