CREATE TABLE IF NOT EXISTS sms_inbound_events (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  sender_id TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  claimed_at INTEGER,
  acked_at INTEGER,
  outcome TEXT
);

CREATE INDEX IF NOT EXISTS idx_sms_inbound_pending
  ON sms_inbound_events (acked_at, expires_at, received_at);

CREATE TABLE IF NOT EXISTS sms_outbound_events (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  message_type TEXT NOT NULL,
  body_sha256 TEXT NOT NULL,
  provider_message_id TEXT,
  provider_status TEXT,
  created_at INTEGER NOT NULL
);
