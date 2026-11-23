CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  email_domain CITEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE account_status AS ENUM ('pending_verification', 'active', 'suspended');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  account_status account_status NOT NULL DEFAULT 'pending_verification',
  department TEXT,
  academic_year SMALLINT CHECK (academic_year BETWEEN 1 AND 8),
  bio TEXT CHECK (char_length(bio) <= 500),
  profile_picture_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  availability TEXT NOT NULL DEFAULT 'open' CHECK (availability IN ('open', 'limited', 'unavailable')),
  preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  verification_token_hash TEXT,
  verification_expires_at TIMESTAMPTZ,
  reset_token_hash TEXT,
  reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_college_id_idx ON users(college_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

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

CREATE TYPE project_status AS ENUM ('recruiting', 'recruitment_closed', 'in_progress', 'completed', 'archived');
CREATE TYPE project_type AS ENUM ('mini_project', 'major_project', 'personal_project', 'research_project', 'hackathon');

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 120),
  short_description TEXT NOT NULL CHECK (char_length(short_description) BETWEEN 20 AND 240),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 40 AND 5000),
  problem_statement TEXT CHECK (char_length(problem_statement) <= 2000),
  proposed_solution TEXT CHECK (char_length(proposed_solution) <= 2000),
  technology_stack TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  project_type project_type NOT NULL,
  team_size SMALLINT NOT NULL CHECK (team_size BETWEEN 1 AND 20),
  recruitment_deadline DATE,
  duration_weeks SMALLINT CHECK (duration_weeks BETWEEN 1 AND 104),
  status project_status NOT NULL DEFAULT 'recruiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level TEXT NOT NULL CHECK (required_level IN ('beginner', 'intermediate', 'advanced')),
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (char_length(role_name) BETWEEN 2 AND 60),
  description TEXT CHECK (char_length(description) <= 500),
  positions_available SMALLINT NOT NULL CHECK (positions_available BETWEEN 1 AND 20)
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS projects_discovery_idx ON projects(college_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id);

CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE RESTRICT,
  introduction_message TEXT NOT NULL CHECK (char_length(introduction_message) BETWEEN 20 AND 1500),
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS applications_one_active_per_project_idx
  ON applications(project_id, applicant_id) WHERE status IN ('pending', 'accepted');
CREATE INDEX IF NOT EXISTS applications_project_status_idx ON applications(project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_applicant_idx ON applications(applicant_id, created_at DESC);

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed');

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  description TEXT CHECK (char_length(description) <= 2000),
  due_date DATE,
  status task_status NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES users(id),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 2 AND 120),
  url TEXT NOT NULL CHECK (url ~* '^https://'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  due_date DATE,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tasks_project_status_idx ON tasks(project_id, status, due_date);
CREATE INDEX IF NOT EXISTS announcements_project_idx ON announcements(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 1000),
  notification_type TEXT NOT NULL CHECK (char_length(notification_type) BETWEEN 2 AND 60),
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx ON bookmarks(user_id, created_at DESC);
