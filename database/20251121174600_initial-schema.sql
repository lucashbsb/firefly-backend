-- =========================================================
-- Firefly - Schema Base + ACL
-- =========================================================

-- Extensão para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------------------
-- 1) Usuários (conta / autenticação)
------------------------------------------------------------
CREATE TABLE tb_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID NULL REFERENCES tb_users(id),
    updated_by          UUID NULL REFERENCES tb_users(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    email               TEXT UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,             -- bcrypt/argon2
    auth_provider       TEXT NOT NULL DEFAULT 'local',  -- 'local', 'google', 'github', ...
    auth_provider_id    TEXT,                      -- id do provider externo (se houver)
    role                TEXT NOT NULL DEFAULT 'student', -- papel "legacy" rápido
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,

    metadata            JSONB DEFAULT '{}'::jsonb
);

------------------------------------------------------------
-- 2) ACL - Roles, Permissions, Role-Permissions, User-Roles
------------------------------------------------------------

-- Papéis (student, admin, teacher, etc.)
CREATE TABLE tb_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    code            TEXT UNIQUE NOT NULL,      -- 'admin', 'student', 'teacher'
    name            TEXT NOT NULL,
    description     TEXT
);

-- Permissões atômicas de domínio
-- Ex: 'skills.create', 'skills.update', 'tracks.view', 'students.view_progress'
CREATE TABLE tb_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    code            TEXT UNIQUE NOT NULL,   -- 'skills.create', 'tracks.manage', ...
    name            TEXT NOT NULL,          -- "Create skills", etc.
    description     TEXT,
    domain          TEXT NOT NULL DEFAULT 'firefly', -- ex.: 'firefly', 'admin'
    target          TEXT NOT NULL DEFAULT 'both'     -- 'backend' | 'frontend' | 'both'
        CHECK (target IN ('backend','frontend','both'))
);

-- Relação N:N entre role e permission
CREATE TABLE tb_role_permissions (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    role_id         UUID NOT NULL REFERENCES tb_roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES tb_permissions(id) ON DELETE CASCADE,

    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- Relação N:N entre user e role
CREATE TABLE tb_user_roles (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    user_id         UUID NOT NULL REFERENCES tb_users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES tb_roles(id) ON DELETE CASCADE,

    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

------------------------------------------------------------
-- 3) Referências: CEFR, categorias, trilhas de skill
------------------------------------------------------------
CREATE TABLE tb_cefr_levels (
    id              SMALLSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    code            TEXT UNIQUE NOT NULL CHECK (code IN ('a1','a2','b1','b2','c1')),
    name            TEXT NOT NULL
);

CREATE TABLE tb_skill_categories (
    id              SMALLSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    code            TEXT UNIQUE NOT NULL,   -- 'grammar', 'vocabulary', 'speaking', ...
    name            TEXT NOT NULL
);

CREATE TABLE tb_skill_tracks (
    id              SMALLSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    code            TEXT UNIQUE NOT NULL,   -- 'general', 'daily_english', 'business', ...
    name            TEXT NOT NULL
);

------------------------------------------------------------
-- 4) Students (entidade pedagógica ligada ao usuário)
------------------------------------------------------------
CREATE TABLE tb_students (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    user_id                 UUID UNIQUE NOT NULL REFERENCES tb_users(id) ON DELETE CASCADE,

    display_name            TEXT,
    initial_level_id        SMALLINT NULL REFERENCES tb_cefr_levels(id),
    current_level_id        SMALLINT NULL REFERENCES tb_cefr_levels(id),

    locale                  TEXT DEFAULT 'pt-BR',
    timezone                TEXT DEFAULT 'America/Sao_Paulo',
    learning_goal           TEXT,
    metadata                JSONB DEFAULT '{}'::jsonb
);

------------------------------------------------------------
-- 5) Ontologia de skills
------------------------------------------------------------
CREATE TABLE tb_skills (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID NULL REFERENCES tb_users(id),
    updated_by          UUID NULL REFERENCES tb_users(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    code                TEXT UNIQUE NOT NULL,      -- 'present_simple_affirmative_a1'
    name                TEXT NOT NULL,            -- pronto pra UI
    description         TEXT NOT NULL,

    category_id         SMALLINT NOT NULL REFERENCES tb_skill_categories(id),
    track_id            SMALLINT NOT NULL REFERENCES tb_skill_tracks(id),

    level_min_id        SMALLINT NOT NULL REFERENCES tb_cefr_levels(id),
    level_max_id        SMALLINT NOT NULL REFERENCES tb_cefr_levels(id),

    importance_weight   SMALLINT NOT NULL CHECK (importance_weight BETWEEN 1 AND 5),
    difficulty_weight   SMALLINT NOT NULL CHECK (difficulty_weight BETWEEN 1 AND 5),

    metadata            JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tb_skill_examples (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NULL REFERENCES tb_users(id),
    updated_by      UUID NULL REFERENCES tb_users(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    skill_id        UUID NOT NULL REFERENCES tb_skills(id) ON DELETE CASCADE,
    example         TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tb_skill_dependencies (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    skill_id                UUID NOT NULL REFERENCES tb_skills(id) ON DELETE CASCADE,
    dependency_skill_id     UUID NOT NULL REFERENCES tb_skills(id) ON DELETE RESTRICT,

    CONSTRAINT uq_skill_dependency UNIQUE (skill_id, dependency_skill_id),
    CONSTRAINT chk_skill_dependency_self CHECK (skill_id <> dependency_skill_id)
);

------------------------------------------------------------
-- 6) Trilhas (learning tracks) e suas skills
------------------------------------------------------------
CREATE TABLE tb_learning_tracks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    code                    TEXT UNIQUE NOT NULL, -- 'english_for_devs', 'british_fluency', ...
    name                    TEXT NOT NULL,
    description             TEXT NOT NULL,

    target_min_level_id     SMALLINT NULL REFERENCES tb_cefr_levels(id),
    target_max_level_id     SMALLINT NULL REFERENCES tb_cefr_levels(id),

    metadata                JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tb_learning_track_skills (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    learning_track_id       UUID NOT NULL REFERENCES tb_learning_tracks(id) ON DELETE CASCADE,
    skill_id                UUID NOT NULL REFERENCES tb_skills(id) ON DELETE RESTRICT,

    sort_order              INTEGER NOT NULL DEFAULT 0,
    is_required             BOOLEAN NOT NULL DEFAULT TRUE,
    track_weight            NUMERIC(4,2) DEFAULT 1.0,

    CONSTRAINT uq_learning_track_skill UNIQUE (learning_track_id, skill_id)
);

------------------------------------------------------------
-- 7) Progresso global do estudante por skill
------------------------------------------------------------
CREATE TABLE tb_student_skill_progress (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    student_id              UUID NOT NULL REFERENCES tb_students(id) ON DELETE CASCADE,
    skill_id                UUID NOT NULL REFERENCES tb_skills(id) ON DELETE RESTRICT,

    mastery_score           NUMERIC(4,3) NOT NULL DEFAULT 0.0,  -- 0.000 – 1.000
    last_seen_at            TIMESTAMPTZ,
    last_result             TEXT,                               -- 'success', 'fail', etc.
    attempts_count          INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT uq_student_skill UNIQUE (student_id, skill_id)
);

------------------------------------------------------------
-- 8) Teste de proficiência (definição do teste)
------------------------------------------------------------
CREATE TABLE tb_proficiency_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    code                    TEXT UNIQUE NOT NULL,
    name                    TEXT NOT NULL,
    description             TEXT NOT NULL,
    target_min_level_id     SMALLINT NULL REFERENCES tb_cefr_levels(id),
    target_max_level_id     SMALLINT NULL REFERENCES tb_cefr_levels(id),
    metadata                JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tb_proficiency_test_items (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    proficiency_test_id     UUID NOT NULL REFERENCES tb_proficiency_tests(id) ON DELETE CASCADE,
    item_type               TEXT NOT NULL,        -- 'mcq', 'gap_fill', 'listening', etc.
    prompt                  TEXT NOT NULL,
    options                 JSONB,                -- para MCQ, se quiser
    correct_answer          JSONB,                -- flexível (texto, índice, etc.)
    sort_order              INTEGER NOT NULL DEFAULT 0,
    metadata                JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tb_proficiency_test_item_skills (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    test_item_id            BIGINT NOT NULL REFERENCES tb_proficiency_test_items(id) ON DELETE CASCADE,
    skill_id                UUID NOT NULL REFERENCES tb_skills(id) ON DELETE RESTRICT,
    skill_weight            NUMERIC(4,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT uq_test_item_skill UNIQUE (test_item_id, skill_id)
);

------------------------------------------------------------
-- 9) Tentativas de teste de proficiência (por estudante)
------------------------------------------------------------
CREATE TABLE tb_student_proficiency_test_attempts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    student_id              UUID NOT NULL REFERENCES tb_students(id) ON DELETE CASCADE,
    proficiency_test_id     UUID NOT NULL REFERENCES tb_proficiency_tests(id) ON DELETE RESTRICT,

    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at             TIMESTAMPTZ,
    estimated_level_id      SMALLINT NULL REFERENCES tb_cefr_levels(id),
    raw_score               NUMERIC(5,2),
    metadata                JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE tb_student_proficiency_test_responses (
    id                      BIGSERIAL PRIMARY KEY,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NULL REFERENCES tb_users(id),
    updated_by              UUID NULL REFERENCES tb_users(id),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    attempt_id              UUID NOT NULL REFERENCES tb_student_proficiency_test_attempts(id) ON DELETE CASCADE,
    test_item_id            BIGINT NOT NULL REFERENCES tb_proficiency_test_items(id) ON DELETE RESTRICT,

    user_answer             JSONB,
    is_correct              BOOLEAN,
    score                   NUMERIC(4,2),
    metadata                JSONB DEFAULT '{}'::jsonb,

    CONSTRAINT uq_attempt_test_item UNIQUE (attempt_id, test_item_id)
);

------------------------------------------------------------
-- 10) Índices básicos de performance
------------------------------------------------------------

-- ACL
CREATE INDEX idx_user_roles_user ON tb_user_roles (user_id);
CREATE INDEX idx_role_permissions_role ON tb_role_permissions (role_id);
CREATE INDEX idx_role_permissions_perm ON tb_role_permissions (permission_id);

-- Skills / Progress
CREATE INDEX idx_student_skill_progress_student ON tb_student_skill_progress (student_id);
CREATE INDEX idx_student_skill_progress_skill ON tb_student_skill_progress (skill_id);
CREATE INDEX idx_skills_code ON tb_skills (code);

-- =========================================================
-- SEED TABELAS BASE FIRELFY
-- tb_cefr_levels, tb_skill_categories, tb_skill_tracks
-- =========================================================

-- Opcional: limpar antes
-- TRUNCATE tb_skill_tracks RESTART IDENTITY CASCADE;
-- TRUNCATE tb_skill_categories RESTART IDENTITY CASCADE;
-- TRUNCATE tb_cefr_levels RESTART IDENTITY CASCADE;

------------------------------------------------------------
-- CEFR LEVELS
------------------------------------------------------------
INSERT INTO tb_cefr_levels (code, name)
VALUES 
  ('a1', 'A1 - Beginner'),
  ('a2', 'A2 - Elementary'),
  ('b1', 'B1 - Intermediate'),
  ('b2', 'B2 - Upper-Intermediate'),
  ('c1', 'C1 - Advanced')
ON CONFLICT (code) DO NOTHING;

------------------------------------------------------------
-- SKILL CATEGORIES
-- Dimensão linguística / tipo de habilidade
------------------------------------------------------------
INSERT INTO tb_skill_categories (code, name)
VALUES
  ('grammar',         'Grammar'),
  ('vocabulary',      'Vocabulary'),
  ('vocabulary_set',  'Vocabulary Set'),
  ('reading',         'Reading'),
  ('listening',       'Listening'),
  ('speaking',        'Speaking'),
  ('writing',         'Writing'),
  ('pronunciation',   'Pronunciation'),
  ('fluency',         'Fluency'),
  ('general',         'General Skills')
ON CONFLICT (code) DO NOTHING;

------------------------------------------------------------
-- SKILL TRACKS
-- Contexto / macro trilha de uso
------------------------------------------------------------
INSERT INTO tb_skill_tracks (code, name)
VALUES
  ('general',        'General English'),
  ('daily_english',  'Daily English'),
  ('business',       'Business English'),
  ('interview',      'Interview English'),
  ('tech_english',   'Tech / Dev English'),
  ('pronunciation',  'Pronunciation Focus')
ON CONFLICT (code) DO NOTHING;
