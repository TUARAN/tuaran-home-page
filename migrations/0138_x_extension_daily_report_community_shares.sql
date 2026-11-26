-- 插件日报面板的「社群」计数（communityShares）此前只在插件本地统计，
-- 上报到站点时被 normalizeXDailyReport 丢弃。补一列让首页与插件面板同一套分类。
ALTER TABLE x_extension_daily_reports ADD COLUMN community_shares INTEGER NOT NULL DEFAULT 0;
