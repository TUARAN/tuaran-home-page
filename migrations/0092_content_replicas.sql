-- 2aran Content Ledger weeks 7-10: IPFS replicas, isolated publisher attempts, mainnet cost.
CREATE TABLE IF NOT EXISTS content_replicas (
  replica_hash TEXT PRIMARY KEY,
  proof_id TEXT NOT NULL,
  content_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  cid TEXT NOT NULL UNIQUE,
  pin_provider TEXT NOT NULL,
  replica_uri TEXT NOT NULL,
  gateway_a TEXT NOT NULL,
  gateway_b TEXT NOT NULL,
  replica_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pinned' CHECK (status IN ('pinned', 'verified', 'failed')),
  verified_at TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (proof_id) REFERENCES content_proofs(proof_id)
);

CREATE TABLE IF NOT EXISTS content_ledger_publish_attempts (
  idempotency_key TEXT PRIMARY KEY,
  merkle_root TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  network TEXT NOT NULL,
  publisher_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'submitted', 'confirmed', 'failed')),
  schema_uid TEXT,
  transaction_hash TEXT UNIQUE,
  attestation_uid TEXT UNIQUE,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  gas_used TEXT,
  effective_gas_price_wei TEXT,
  cost_wei TEXT,
  latency_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS content_ledger_cost_events (
  idempotency_key TEXT PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  network TEXT NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  publisher_address TEXT NOT NULL,
  gas_used TEXT NOT NULL,
  effective_gas_price_wei TEXT NOT NULL,
  cost_wei TEXT NOT NULL,
  latency_ms INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_replicas_content_key ON content_replicas(content_key, version DESC);
CREATE INDEX IF NOT EXISTS idx_content_ledger_attempts_network ON content_ledger_publish_attempts(network, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_ledger_cost_network ON content_ledger_cost_events(network, created_at DESC);
