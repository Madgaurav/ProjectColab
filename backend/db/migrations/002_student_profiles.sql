-- Apply this migration to databases created before Module 2.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'open' CHECK (availability IN ('open', 'limited', 'unavailable'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name CITEXT NOT NULL UNIQUE CHECK (char_length(skill_name) BETWEEN 1 AND 50)
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL CHECK (char_length(interest) BETWEEN 1 AND 50),
  PRIMARY KEY (user_id, interest)
);

CREATE INDEX IF NOT EXISTS user_skills_skill_id_idx ON user_skills(skill_id);
