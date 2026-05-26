CREATE TABLE IF NOT EXISTS research_pv (
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  pv INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (category, slug)
);

CREATE INDEX IF NOT EXISTS idx_research_pv_updated_at ON research_pv (updated_at DESC);
