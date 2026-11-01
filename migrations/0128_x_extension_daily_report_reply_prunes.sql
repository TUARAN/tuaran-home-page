-- Keep deleted comments separate from deleted original posts.
ALTER TABLE x_extension_daily_reports ADD COLUMN reply_prunes INTEGER NOT NULL DEFAULT 0;
