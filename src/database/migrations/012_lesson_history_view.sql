DROP VIEW IF EXISTS lesson_history_view;

CREATE VIEW lesson_history_view AS
SELECT
    l.id as lesson_id,
    l.user_id,
    l.day,
    l.topic,
    l.status,
    l.phase,
    l.level,
    l.theory,
    l.grammar_focus,
    l.vocabulary_focus,
    l.exercises_answered,
    l.exercises_total,
    l.chat_questions_answered,
    l.chat_questions_total,
    l.created_at as lesson_created_at,
    (l.status = 'completed') as completed,
    r.id as report_id,
    r.performance_score,
    r.accuracy_rate,
    r.exercises_correct,
    r.strengths,
    r.weaknesses,
    r.error_breakdown,
    r.skill_scores,
    r.next_day_focus,
    r.perceived_level,
    r.motivational_note,
    r.created_at as report_created_at
FROM
    lessons l
    LEFT JOIN daily_reports r ON r.user_id = l.user_id
    AND r.day = l.day;

CREATE INDEX IF NOT EXISTS idx_lessons_user_day ON lessons (user_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_reports_user_day ON daily_reports (user_id, day);