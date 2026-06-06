-- Menu visibility overrides set from the admin console (站长后台).
-- The source-of-truth `SITE_CHANNELS` config lives in lib/siteNav.js;
-- rows here override the `audience` field for an individual `href`.
-- audience ∈ ('public', 'authed', 'owner'). NULL/missing row means "use config default".
CREATE TABLE IF NOT EXISTS nav_overrides (
  href TEXT PRIMARY KEY,
  audience TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nav_overrides_audience
  ON nav_overrides (audience);
