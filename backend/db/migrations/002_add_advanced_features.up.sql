ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN last_seen TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT FALSE;

CREATE TABLE friend_requests (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id, status);

CREATE TABLE friendships (
  user_id1 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id2 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id1, user_id2),
  CHECK (user_id1 < user_id2)
);

CREATE INDEX idx_friendships_user1 ON friendships(user_id1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id2);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'friend_request', 'friend_accepted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE messages ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN deleted_by_sender BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE;

CREATE TABLE message_deletions (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE typing_indicators (
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_typed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX idx_typing_indicators_chat ON typing_indicators(chat_id, last_typed_at DESC);

CREATE TABLE statuses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
  content TEXT,
  media_url TEXT,
  background_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_statuses_user ON statuses(user_id, created_at DESC);
CREATE INDEX idx_statuses_expires ON statuses(expires_at);

CREATE TABLE status_views (
  status_id TEXT NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (status_id, viewer_id)
);

CREATE INDEX idx_status_views_status ON status_views(status_id, viewed_at DESC);

CREATE TABLE status_privacy (
  status_id TEXT NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  hidden_from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (status_id, hidden_from_user_id)
);

ALTER TABLE chat_participants ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_participants ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;

CREATE TABLE pinned_messages (
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by TEXT NOT NULL REFERENCES users(id),
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_id, message_id)
);

CREATE INDEX idx_pinned_messages_chat ON pinned_messages(chat_id, pinned_at DESC);

ALTER TABLE chats ADD COLUMN group_image_url TEXT;
ALTER TABLE chats ADD COLUMN description TEXT;
