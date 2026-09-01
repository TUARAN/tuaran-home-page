-- 将“页面挂载即计数”升级为经服务端验证的有效阅读事件。
-- 旧行保留为 legacy，后台主指标只采用 qualified；不删除历史记录。
ALTER TABLE research_pv_hits ADD COLUMN quality TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE research_pv_hits ADD COLUMN engaged_ms INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_research_pv_hits_quality_period
  ON research_pv_hits (quality, created_at);
