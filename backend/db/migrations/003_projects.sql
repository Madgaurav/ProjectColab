CREATE TYPE project_status AS ENUM ('recruiting', 'recruitment_closed', 'in_progress', 'completed', 'archived');
CREATE TYPE project_type AS ENUM ('mini_project', 'major_project', 'personal_project', 'research_project', 'hackathon');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), college_id UUID NOT NULL REFERENCES colleges(id), owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 120), short_description TEXT NOT NULL CHECK (char_length(short_description) BETWEEN 20 AND 240),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 40 AND 5000), problem_statement TEXT CHECK (char_length(problem_statement) <= 2000),
  proposed_solution TEXT CHECK (char_length(proposed_solution) <= 2000), technology_stack TEXT[] NOT NULL DEFAULT '{}', category TEXT NOT NULL,
  project_type project_type NOT NULL, team_size SMALLINT NOT NULL CHECK (team_size BETWEEN 1 AND 20), recruitment_deadline DATE,
  duration_weeks SMALLINT CHECK (duration_weeks BETWEEN 1 AND 104), status project_status NOT NULL DEFAULT 'recruiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE project_skills (project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE, required_level TEXT NOT NULL CHECK (required_level IN ('beginner', 'intermediate', 'advanced')), PRIMARY KEY (project_id, skill_id));
CREATE TABLE project_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, role_name TEXT NOT NULL CHECK (char_length(role_name) BETWEEN 2 AND 60), description TEXT CHECK (char_length(description) <= 500), positions_available SMALLINT NOT NULL CHECK (positions_available BETWEEN 1 AND 20));
CREATE TABLE team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, joined_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (project_id, user_id));
CREATE INDEX projects_discovery_idx ON projects(college_id, status, created_at DESC);
CREATE INDEX projects_owner_idx ON projects(owner_id);
