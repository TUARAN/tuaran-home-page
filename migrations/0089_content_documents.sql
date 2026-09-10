-- Git-authored research snapshots. Existing article_posts remains the editor's source of truth.
-- content_index is the shared metadata projection; content_key preserves comments and entitlements.
CREATE TABLE IF NOT EXISTS content_documents (
  content_key TEXT PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (document_type IN ('research')),
  category TEXT NOT NULL CHECK (category IN ('companies', 'topics', 'people')),
  slug TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  body_json TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (category, slug)
);
CREATE INDEX IF NOT EXISTS idx_content_documents_status ON content_documents(status, category, updated_at DESC);

-- Keep tombstones and aliases after retirement. Never let an old static snapshot revive a withdrawn page.
CREATE TABLE IF NOT EXISTS content_routes (
  pathname TEXT PRIMARY KEY,
  content_key TEXT NOT NULL REFERENCES content_documents(content_key) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_content_routes_key ON content_routes(content_key);

-- Reserve shared /articles/<slug> paths across both stores, including drafts.
-- Triggers close the race between preflight checks and the publication batch.
CREATE TRIGGER IF NOT EXISTS content_routes_article_collision
BEFORE INSERT ON content_routes
WHEN EXISTS (SELECT 1 FROM article_posts WHERE NEW.pathname = '/articles/' || slug)
BEGIN SELECT RAISE(ABORT, 'CONTENT_ROUTE_CONFLICT'); END;

CREATE TRIGGER IF NOT EXISTS article_posts_research_collision_insert
BEFORE INSERT ON article_posts
WHEN EXISTS (SELECT 1 FROM content_routes WHERE pathname = '/articles/' || NEW.slug)
BEGIN SELECT RAISE(ABORT, 'CONTENT_ROUTE_CONFLICT'); END;

CREATE TRIGGER IF NOT EXISTS article_posts_research_collision_update
BEFORE UPDATE OF slug ON article_posts
WHEN EXISTS (SELECT 1 FROM content_routes WHERE pathname = '/articles/' || NEW.slug)
BEGIN SELECT RAISE(ABORT, 'CONTENT_ROUTE_CONFLICT'); END;
