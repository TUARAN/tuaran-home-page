-- 2aran Content Ledger: signed proof index and Merkle batch anchors.
-- Full proof and batch JSON remain public files; D1 is the query/index layer.
CREATE TABLE IF NOT EXISTS content_proof_batches (
  merkle_root TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  item_count INTEGER NOT NULL CHECK (item_count BETWEEN 1 AND 20),
  manifest_hash TEXT NOT NULL UNIQUE,
  manifest_uri TEXT,
  previous_root TEXT,
  chain_id INTEGER,
  contract_address TEXT,
  schema_uid TEXT,
  attestation_uid TEXT UNIQUE,
  transaction_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'revoked')),
  generated_at TEXT NOT NULL,
  anchored_at TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS content_proofs (
  proof_id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  content_hash TEXT NOT NULL,
  site_key_id TEXT NOT NULL,
  published_at TEXT NOT NULL,
  previous_proof_id TEXT,
  merkle_root TEXT,
  merkle_leaf TEXT,
  merkle_path_json TEXT,
  proof_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('signed', 'batched', 'submitted', 'confirmed', 'failed', 'revoked')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (content_key, version),
  FOREIGN KEY (previous_proof_id) REFERENCES content_proofs(proof_id),
  FOREIGN KEY (merkle_root) REFERENCES content_proof_batches(merkle_root)
);

CREATE INDEX IF NOT EXISTS idx_content_proofs_content_key ON content_proofs(content_key, version DESC);
CREATE INDEX IF NOT EXISTS idx_content_proofs_batch ON content_proofs(merkle_root);
CREATE INDEX IF NOT EXISTS idx_content_proof_batches_status ON content_proof_batches(status, generated_at DESC);
