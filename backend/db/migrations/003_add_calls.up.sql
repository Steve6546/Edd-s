CREATE TABLE calls (
  id TEXT PRIMARY KEY,
  caller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('voice', 'video')),
  status VARCHAR(20) NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'rejected', 'missed')),
  initiated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_recipient ON calls(recipient_id);
CREATE INDEX idx_calls_status ON calls(status);
