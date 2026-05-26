CREATE TABLE IF NOT EXISTS research_pv_hits (
  hit_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_pv_hits_created_at ON research_pv_hits (created_at);
CREATE INDEX IF NOT EXISTS idx_research_pv_hits_entry_bucket
  ON research_pv_hits (category, slug, bucket);
