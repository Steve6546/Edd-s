ALTER TABLE users ADD COLUMN profile_setup_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

CREATE INDEX idx_users_profile_setup ON users(profile_setup_completed);
