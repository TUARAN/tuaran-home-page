ALTER TABLE sms_inbound_events ADD COLUMN provider TEXT NOT NULL DEFAULT 'twilio';
ALTER TABLE sms_outbound_events ADD COLUMN provider TEXT NOT NULL DEFAULT 'twilio';

CREATE INDEX IF NOT EXISTS idx_sms_inbound_provider
  ON sms_inbound_events (provider, received_at);
