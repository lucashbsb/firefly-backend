CREATE TABLE IF NOT EXISTS user_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'openai' CHECK (
        provider IN ('openai', 'anthropic', 'grok')
    ),
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    api_key TEXT,
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.5 CHECK (
        temperature >= 0
        AND temperature <= 2
    ),
    max_tokens INTEGER NOT NULL DEFAULT 16384 CHECK (
        max_tokens > 0
        AND max_tokens <= 128000
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE INDEX idx_user_ai_settings_user_id ON user_ai_settings (user_id);