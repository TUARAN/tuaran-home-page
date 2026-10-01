CREATE TABLE IF NOT EXISTS festival_banners (
  id TEXT PRIMARY KEY,
  festival_key TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  compact_title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  badge_value TEXT NOT NULL DEFAULT '',
  badge_label TEXT NOT NULL DEFAULT '',
  left_image TEXT NOT NULL DEFAULT '',
  right_image TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'red-gold',
  animate_left INTEGER NOT NULL DEFAULT 0 CHECK (animate_left IN (0, 1)),
  priority INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_festival_banners_active
  ON festival_banners(enabled, start_at, end_at, priority DESC);

INSERT OR IGNORE INTO festival_banners (
  id, festival_key, name, enabled, start_at, end_at, title, compact_title,
  subtitle, badge_value, badge_label, left_image, right_image, theme,
  animate_left, priority, created_at, updated_at, updated_by
) VALUES (
  'national-day-2026', 'national-day', '国庆节 2026', 1,
  1790784000000, 1791734399999,
  '热烈庆祝中华人民共和国成立', '热烈庆祝新中国成立',
  '一九四九 · 二〇二六', '77', '周年',
  '/images/home/national-day-flag.webp',
  '/images/home/national-day-tiananmen.webp',
  'red-gold', 1, 100,
  strftime('%s','now') * 1000, strftime('%s','now') * 1000, 'migration'
);
