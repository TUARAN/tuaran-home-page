-- Older reports retain the unknown post count as 0 until uploaded again from the plugin.
ALTER TABLE x_extension_daily_reports ADD COLUMN posts INTEGER NOT NULL DEFAULT 0;
