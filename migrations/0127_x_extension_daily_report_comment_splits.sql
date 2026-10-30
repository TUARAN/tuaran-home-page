-- Comment splits from the extension daily report: 评论首页 / 回复评论 / 评论大V.
-- Older rows keep 0 until the plugin uploads again.
ALTER TABLE x_extension_daily_reports ADD COLUMN timeline_comments INTEGER NOT NULL DEFAULT 0;
ALTER TABLE x_extension_daily_reports ADD COLUMN notification_comments INTEGER NOT NULL DEFAULT 0;
ALTER TABLE x_extension_daily_reports ADD COLUMN kol_comments INTEGER NOT NULL DEFAULT 0;
