ALTER TABLE messages ADD COLUMN reply_to_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN is_system_message BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

CREATE TABLE message_mentions (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, mentioned_user_id)
);

CREATE INDEX idx_message_mentions_user ON message_mentions(mentioned_user_id, created_at DESC);

CREATE TABLE message_reads (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_message_reads_user ON message_reads(user_id, read_at DESC);
CREATE INDEX idx_message_reads_message ON message_reads(message_id);

ALTER TABLE chat_participants ADD COLUMN mute_until TIMESTAMPTZ;
ALTER TABLE chat_participants ADD COLUMN last_read_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX idx_chat_participants_last_read ON chat_participants(chat_id, last_read_message_id);
