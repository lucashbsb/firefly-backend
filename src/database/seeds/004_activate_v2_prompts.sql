-- Fix: Activate all v2 prompts
-- Run this after 003_system_prompts_v2.sql if prompts are not active

-- First, deactivate all prompts
UPDATE system_prompts SET is_active = false;

-- Activate all v2 prompts (by name or by version 2)
UPDATE system_prompts
SET
    is_active = true
WHERE
    name IN (
        'lesson_v2',
        'correction_v2',
        'report_v2',
        'conversation_v2'
    )
    OR (
        version = 2
        AND name LIKE '%_v2'
    );

-- Verify
SELECT
    name,
    is_active,
    version,
    prompt_type_id
FROM system_prompts
ORDER BY name;