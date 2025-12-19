CREATE TABLE IF NOT EXISTS system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_prompts_active ON system_prompts (is_active)
WHERE
    is_active = true;

CREATE INDEX idx_system_prompts_name ON system_prompts (name);

CREATE OR REPLACE FUNCTION ensure_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE system_prompts SET is_active = false WHERE is_active = true AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_prompt
    BEFORE INSERT OR UPDATE ON system_prompts
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_prompt();