CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (
        mastery_level >= 0
        AND mastery_level <= 100
    ),
    practice_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS sr_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    card_type TEXT NOT NULL DEFAULT 'vocabulary' CHECK (
        card_type IN (
            'vocabulary',
            'grammar',
            'error',
            'phrase'
        )
    ),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    context TEXT,
    source_day INTEGER,
    skill_tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sr_card_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    card_id UUID NOT NULL REFERENCES sr_cards (id) ON DELETE CASCADE,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE (card_id)
);

CREATE TABLE IF NOT EXISTS sr_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    card_id UUID NOT NULL REFERENCES sr_cards (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    quality INTEGER NOT NULL CHECK (
        quality >= 0
        AND quality <= 5
    ),
    ease_factor_before NUMERIC(4, 2) NOT NULL,
    ease_factor_after NUMERIC(4, 2) NOT NULL,
    interval_before INTEGER NOT NULL,
    interval_after INTEGER NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_level ON skills (level);

CREATE INDEX idx_skills_category ON skills (category);

CREATE INDEX idx_user_skills_user ON user_skills (user_id);

CREATE INDEX idx_user_skills_skill ON user_skills (skill_id);

CREATE INDEX idx_sr_cards_user ON sr_cards (user_id);

CREATE INDEX idx_sr_card_states_next_review ON sr_card_states (next_review_at);

CREATE INDEX idx_sr_reviews_card ON sr_reviews (card_id);

CREATE INDEX idx_sr_reviews_user ON sr_reviews (user_id);