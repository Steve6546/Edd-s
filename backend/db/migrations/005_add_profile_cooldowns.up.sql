ALTER TABLE users ADD COLUMN avatar_last_changed TIMESTAMP;
ALTER TABLE users ADD COLUMN display_name_last_changed TIMESTAMP;
ALTER TABLE users ADD COLUMN username_last_changed TIMESTAMP;

CREATE INDEX idx_users_avatar_cooldown ON users(avatar_last_changed);
CREATE INDEX idx_users_display_name_cooldown ON users(display_name_last_changed);
CREATE INDEX idx_users_username_cooldown ON users(username_last_changed);
