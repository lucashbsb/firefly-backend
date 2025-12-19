-- ============================================================================
-- MIGRATION: Fix trigger to allow one active prompt PER TYPE
-- ============================================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_single_active_prompt ON system_prompts;

DROP FUNCTION IF EXISTS ensure_single_active_prompt ();

-- Create new function that ensures one active prompt PER TYPE
CREATE OR REPLACE FUNCTION ensure_single_active_prompt_per_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true AND NEW.prompt_type_id IS NOT NULL THEN
        UPDATE system_prompts 
        SET is_active = false 
        WHERE is_active = true 
          AND id != NEW.id 
          AND prompt_type_id = NEW.prompt_type_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER trigger_single_active_prompt_per_type
    BEFORE INSERT OR UPDATE ON system_prompts
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_prompt_per_type();

-- Now activate all v2 prompts (this will work correctly with new trigger)
UPDATE system_prompts SET is_active = true WHERE name = 'lesson_v2';

UPDATE system_prompts
SET
    is_active = true
WHERE
    name = 'correction_v2';

UPDATE system_prompts SET is_active = true WHERE name = 'report_v2';

UPDATE system_prompts
SET
    is_active = true
WHERE
    name = 'conversation_v2';