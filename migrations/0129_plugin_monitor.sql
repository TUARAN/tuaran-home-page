-- Plugin identity is distinct from destination platforms. No content or API keys.
CREATE TABLE IF NOT EXISTS plugin_instances (
  plugin_id TEXT NOT NULL, device_id TEXT NOT NULL, version TEXT NOT NULL,
  snapshot_json TEXT NOT NULL DEFAULT '{}', last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (plugin_id, device_id)
);
CREATE TABLE IF NOT EXISTS plugin_commands (
  id TEXT PRIMARY KEY, plugin_id TEXT NOT NULL, device_id TEXT NOT NULL,
  command TEXT NOT NULL, argument TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', result TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  claimed_at INTEGER, finished_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_plugin_commands_device ON plugin_commands(plugin_id, device_id, status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plugin_commands_active ON plugin_commands(plugin_id,device_id,command,argument) WHERE status IN ('pending','claimed');
CREATE TABLE IF NOT EXISTS plugin_events (
  id TEXT NOT NULL, plugin_id TEXT NOT NULL, device_id TEXT NOT NULL,
  kind TEXT NOT NULL, platform_id TEXT NOT NULL DEFAULT '', outcome TEXT NOT NULL,
  public_count INTEGER NOT NULL DEFAULT 0, private_count INTEGER NOT NULL DEFAULT 0,
  occurred_at INTEGER NOT NULL, PRIMARY KEY(plugin_id, device_id, id)
);
CREATE INDEX IF NOT EXISTS idx_plugin_events_date ON plugin_events(plugin_id, occurred_at);
