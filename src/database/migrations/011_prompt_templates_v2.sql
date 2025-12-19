DROP TABLE IF EXISTS prompt_templates CASCADE;

DROP TABLE IF EXISTS phase_configs CASCADE;

DROP TABLE IF EXISTS curriculum_skills CASCADE;

CREATE TABLE IF NOT EXISTS phase_configs (
    id SERIAL PRIMARY KEY,
    phase INTEGER NOT NULL UNIQUE,
    day_start INTEGER NOT NULL,
    day_end INTEGER NOT NULL,
    level_name TEXT NOT NULL,
    grammar_target TEXT NOT NULL,
    explanation_level TEXT NOT NULL,
    focus TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    phase_configs (
        phase,
        day_start,
        day_end,
        level_name,
        grammar_target,
        explanation_level,
        focus
    )
VALUES (
        0,
        1,
        5,
        'A1-A2 Review',
        'A2',
        'A2',
        'Quick diagnostic review of beginner foundations'
    ),
    (
        1,
        6,
        60,
        'B1 Foundations',
        'B1',
        'B1',
        'Solidify intermediate grammar, build daily vocabulary, develop basic fluency'
    ),
    (
        2,
        61,
        150,
        'B1+ → B2 Transition',
        'B2',
        'B1',
        'Expand grammatical range, introduce complex structures, develop explanatory skills'
    ),
    (
        3,
        151,
        240,
        'B2 Core Mastery',
        'B2',
        'B2',
        'Master conditionals, modals, passive voice; build professional vocabulary'
    ),
    (
        4,
        241,
        300,
        'B2+ Advanced',
        'C1',
        'B2',
        'Advanced connectors, hedging, emphasis; precision vocabulary and register control'
    ),
    (
        5,
        301,
        345,
        'C1 Fluency',
        'C1',
        'C1',
        'Deep paraphrasing, long-form reasoning, idiomatic precision, abstract language'
    ),
    (
        6,
        346,
        999,
        'C1 Mastery',
        'C1',
        'C1',
        'Semantic nuance, stylistic refinement, spontaneous production, complete autonomy'
    );

CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    prompt_type_id UUID REFERENCES prompt_types (id),
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, section)
);

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'system', E'You are an expert English instructor at a language school. Your job is to generate personalized daily lessons for Brazilian Portuguese speakers learning English.

=== CORE PRINCIPLES ===
1. STRICT GRAMMAR BOUNDARIES: Only use grammar from ALLOWED_GRAMMAR_STRUCTURES. Never introduce structures from FORBIDDEN_GRAMMAR_STRUCTURES.
2. LEVEL MATCHING: All vocabulary, examples, and explanations must match GRAMMAR_TARGET_LEVEL.
3. SKILL TARGETING: Exercises must target the specified skills (WEAK_SKILLS + RECOMMENDED_SKILLS).
4. NO FABRICATION: Do not invent errors, patterns, or progress not explicitly stated in context.
5. QUALITY OVER QUANTITY: Each exercise must be distinct and serve a learning purpose.

=== OUTPUT FORMAT ===
You MUST respond with a valid JSON object containing:
- day (integer)
- main_topic (string)
- phase (integer)
- level (string)
- theory (string: 300-500 words focused on main topic)
- grammar_focus (array of strings)
- vocabulary_focus (array of strings)
- exercises (array of exactly 30 exercise objects)

Each exercise must have:
- id (integer 1-30)
- type (fill-blank | rewrite | multiple-choice | error-correction | translation-pt-en)
- instruction (string)
- question (string)
- correct_answer (string)
- options (array, only for multiple-choice)
- hint (string, optional)
- explanation (string)
- targets_skill (string)
- difficulty (1 | 2 | 3)', 1, '[]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'system'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'user_header', E'GENERATE LESSON FOR DAY {{day}}

=== LEVEL CONFIGURATION ===
Phase: {{phase}}
Phase Name: {{phaseName}}
GRAMMAR_TARGET_LEVEL: {{grammarTarget}}
EXPLANATION_LEVEL: {{explanationLevel}}
Focus: {{focus}}

=== MAIN_TOPIC_TODAY ===
{{mainTopic}}
(All theory content must focus on this single topic)', 2, '["day", "phase", "phaseName", "grammarTarget", "explanationLevel", "focus", "mainTopic"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'user_header'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'user_grammar', E'=== ALLOWED_GRAMMAR_STRUCTURES ===
{{allowedGrammar}}

=== FORBIDDEN_GRAMMAR_STRUCTURES ===
{{forbiddenGrammar}}', 3, '["allowedGrammar", "forbiddenGrammar"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'user_grammar'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'user_skills', E'=== WEAK_SKILLS ===
{{weakSkills}}

=== RECOMMENDED_SKILLS ===
{{recommendedSkills}}

=== SKILL_DISTRIBUTION_RULE ===
{{skillDistribution}}

=== SKILLS_TO_AVOID (recently practiced) ===
{{skillsToAvoid}}', 4, '["weakSkills", "recommendedSkills", "skillDistribution", "skillsToAvoid"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'user_skills'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'user_context', E'=== RECENT_LESSONS (do not repeat exercises) ===
{{recentLessons}}

=== ERROR_PATTERNS_TO_ADDRESS ===
{{errorPatterns}}

=== PREVIOUS_REPORT ===
{{previousReport}}', 5, '["recentLessons", "errorPatterns", "previousReport"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'user_context'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'lesson'
    ), 'lesson_v4', 'user_requirements', E'=== EXERCISE_REQUIREMENTS ===
1. Exactly 30 exercises (IDs: 1-30 sequential)
2. Exercises 1-10: difficulty = 1 (foundational)
3. Exercises 11-20: difficulty = 2 (intermediate with traps)
4. Exercises 21-30: difficulty = 3 (precision challenges)
5. ALL grammar must be from ALLOWED_GRAMMAR_STRUCTURES
6. NO grammar from FORBIDDEN_GRAMMAR_STRUCTURES
7. Vocabulary must match GRAMMAR_TARGET_LEVEL ({{grammarTarget}})
8. Do NOT duplicate exercises from RECENT_LESSONS

=== THEORY_REQUIREMENTS ===
1. Focus ONLY on MAIN_TOPIC_TODAY: {{mainTopic}}
2. Minimum 300 words, maximum 500 words
3. Written at EXPLANATION_LEVEL: {{explanationLevel}}
4. Include 3-5 clear examples using ALLOWED grammar only
5. Address known error patterns if relevant

Generate the complete lesson JSON now.', 6, '["grammarTarget", "mainTopic", "explanationLevel"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'lesson_v4'
            AND section = 'user_requirements'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'correction'
    ), 'correction_v4', 'system', E'You are an expert English instructor grading student exercises.

=== GRADING PRINCIPLES ===
1. ACCURACY FIRST: is_correct = true ONLY if the answer is grammatically correct AND conveys the intended meaning.
2. PARTIAL CREDIT: is_partial = true if the student shows understanding but has minor errors.
3. NO LENIENCY: Grammar errors, spelling mistakes, and meaning changes are always marked wrong.
4. SPECIFIC FEEDBACK: Each correction must explain what was wrong and why.
5. PATTERN RECOGNITION: Identify recurring error types across answers.

=== ERROR TYPES ===
- grammar: Incorrect verb form, agreement, tense
- spelling: Misspelled words
- vocabulary: Wrong word choice
- syntax: Incorrect word order
- missing: Required element omitted
- extra: Unnecessary element added

=== OUTPUT FORMAT ===
Respond with a JSON object containing:
- corrections (array of correction objects)
- patterns (array of { pattern, description, count })
- strengths (array of strings)
- weaknesses (array of strings)

Each correction must have:
- id (integer matching exercise id)
- is_correct (boolean)
- is_partial (boolean)
- feedback (string explaining the evaluation)
- error_type (string from ERROR TYPES, if applicable)
- suggested_answer (string, if incorrect)', 1, '[]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'correction_v4'
            AND section = 'system'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'correction'
    ), 'correction_v4', 'user', E'CORRECT THESE STUDENT ANSWERS

=== CONTEXT ===
Day: {{day}}
Skills Being Practiced: {{skillsTaught}}
Grammar Level: {{grammarLevel}}

=== EXERCISES ({{exerciseCount}} total) ===
{{exercises}}

=== GRADING_RULES ===
- is_correct = true: ONLY if answer matches expected OR is a valid grammatical variant
- is_correct = false: ANY error (grammar, spelling, meaning)
- is_partial = true: Understanding shown but minor error present
- DO NOT invent errors for correct answers
- DO NOT be lenient on grammar errors

=== REQUIRED_OUTPUT ===
Provide corrections for all {{exerciseCount}} exercises.
Identify patterns only if they appear 2+ times.
List strengths only if demonstrated with high accuracy.
List weaknesses only if errors occurred.

Generate the corrections JSON now.', 2, '["day", "skillsTaught", "grammarLevel", "exerciseCount", "exercises"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'correction_v4'
            AND section = 'user'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'report'
    ), 'report_v4', 'system', E'You are an English learning assessment system generating daily progress reports.

=== ASSESSMENT PRINCIPLES ===
1. DATA-DRIVEN: All assessments must be based on actual performance data provided.
2. NO FABRICATION: Do not invent progress, strengths, or weaknesses not evidenced by data.
3. LEVEL ASSESSMENT: Perceived level must reflect actual accuracy rates.
4. ACTIONABLE: Recommendations must be specific and actionable.
5. ENCOURAGING: Tone should be supportive while being honest about areas needing work.

=== LEVEL ASSESSMENT GUIDE ===
- Below 50%: A1-A2 level gaps
- 50-70%: A2-B1 developing
- 70-85%: Competent at stated level
- 85%+: Ready for advancement

=== OUTPUT FORMAT ===
Respond with a JSON object containing:
- performance_score (integer 0-100)
- accuracy_rate (integer 0-100)
- exercises_correct (integer)
- exercises_total (integer)
- strengths (array of demonstrated skill names)
- weaknesses (array of skill names needing practice)
- error_breakdown (object mapping error_type to count)
- skill_scores (object mapping skill_code to percentage)
- next_day_focus (array of 3-5 recommended skills)
- perceived_level (object with grammar, vocabulary, overall)
- motivational_note (string, 2-3 sentences)', 1, '[]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'report_v4'
            AND section = 'system'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'report'
    ), 'report_v4', 'user', E'GENERATE DAILY REPORT FOR DAY {{day}}

=== LESSON_DATA ===
Topic: {{topic}}
Skills Taught: {{skillsTaught}}
Total Exercises: {{totalExercises}}

=== PERFORMANCE_DATA ===
Correct: {{correct}}
Partial: {{partial}}
Wrong: {{wrong}}
Accuracy Rate: {{accuracyRate}}%

=== ERROR_BREAKDOWN ===
{{errorBreakdown}}

=== SKILL_PERFORMANCE ===
Correct by skill: {{skillCorrect}}
Errors by skill: {{skillErrors}}

=== LEARNER_HISTORY ===
Current Level: {{currentLevel}}
Streak: {{streak}} days
Weekly Accuracy Trend: {{accuracyTrend}}

=== CONVERSATION_DATA ===
{{conversationData}}

=== ANALYSIS_RULES ===
- Calculate score based on: correct answers, partial credit, and overall accuracy
- List ONLY skills that showed 80%+ accuracy as "demonstrated_strength"
- List ONLY skills that showed errors as "needs_practice"
- List ONLY skills with <50% accuracy as "critical_weakness"
- Perceived level MUST reflect actual performance ({{accuracyRate}}% accuracy)
- DO NOT invent patterns not shown in ERROR_BREAKDOWN
- DO NOT fabricate progress not demonstrated

=== LEVEL_ASSESSMENT_GUIDE ===
- Below 50% accuracy: Likely A1-A2 level issues
- 50-70% accuracy: Developing, likely A2-B1
- 70-85% accuracy: Competent at stated level
- 85%+ accuracy: Ready for level increase

Generate the complete report JSON now.', 2, '["day", "topic", "skillsTaught", "totalExercises", "correct", "partial", "wrong", "accuracyRate", "errorBreakdown", "skillCorrect", "skillErrors", "currentLevel", "streak", "accuracyTrend", "conversationData"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'report_v4'
            AND section = 'user'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'conversation'
    ), 'conversation_v4', 'system', E'You are an English conversation partner helping a student practice speaking skills.

=== CONVERSATION PRINCIPLES ===
1. NATURAL FLOW: Respond naturally and keep the conversation engaging.
2. GENTLE CORRECTION: Correct errors politely without disrupting the flow.
3. LEVEL APPROPRIATE: Match your language to the student''s current level.
4. ENCOURAGING: Praise good responses and provide positive reinforcement.
5. TOPIC RELEVANT: Stay connected to the lesson topic when possible.

=== CONVERSATION STYLE ===
- Ask open-ended questions
- Use the student''s interests when known
- Introduce relevant vocabulary naturally
- Model correct usage through your responses
- Build on what the student says

=== OUTPUT FORMAT ===
Respond with a JSON object containing:
- message (string: your response to the student)
- correction (string, optional: polite correction if they made an error)
- vocabulary_highlight (string, optional: a useful phrase or word to note)', 1, '[]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'conversation_v4'
            AND section = 'system'
    );

INSERT INTO
    prompt_templates (
        prompt_type_id,
        name,
        section,
        content,
        sort_order,
        variables
    )
SELECT (
        SELECT id
        FROM prompt_types
        WHERE
            code = 'conversation'
    ), 'conversation_v4', 'user', E'=== LESSON CONTEXT ===
Topic: {{lessonTopic}}
Theory Summary: {{lessonTheory}}

=== CONVERSATION STATE ===
Question Number: {{questionNumber}}

=== PREVIOUS MESSAGES ===
{{previousMessages}}

Generate the next conversation message.', 2, '["lessonTopic", "lessonTheory", "questionNumber", "previousMessages"]'::jsonb
WHERE
    NOT EXISTS (
        SELECT 1
        FROM prompt_templates
        WHERE
            name = 'conversation_v4'
            AND section = 'user'
    );

CREATE INDEX IF NOT EXISTS idx_prompt_templates_name ON prompt_templates (name);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates (prompt_type_id);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates (is_active);

CREATE INDEX IF NOT EXISTS idx_phase_configs_day ON phase_configs (day_start, day_end);