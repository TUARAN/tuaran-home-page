ALTER TABLE short_links ADD COLUMN title TEXT;
ALTER TABLE short_links ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE short_links ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE short_links ADD COLUMN last_clicked_at INTEGER;
ALTER TABLE short_links ADD COLUMN updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_short_links_original ON short_links(original);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON short_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_links_clicks ON short_links(click_count DESC, last_clicked_at DESC);
