ALTER TABLE short_links ADD COLUMN code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
