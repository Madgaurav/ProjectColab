CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160), message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 1000),
  notification_type TEXT NOT NULL CHECK (char_length(notification_type) BETWEEN 2 AND 60), related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id, is_read, created_at DESC);
