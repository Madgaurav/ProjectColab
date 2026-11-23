CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, project_role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE RESTRICT,
  introduction_message TEXT NOT NULL CHECK (char_length(introduction_message) BETWEEN 20 AND 1500), status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX applications_one_active_per_project_idx ON applications(project_id, applicant_id) WHERE status IN ('pending', 'accepted');
CREATE INDEX applications_project_status_idx ON applications(project_id, status, created_at DESC);
CREATE INDEX applications_applicant_idx ON applications(applicant_id, created_at DESC);
