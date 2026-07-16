-- 阅读分析事件从「7 天计数」升级为可做 30/90 天、多身份与来源归因的明细事件。
-- 历史行保留为空值；新维度从迁移上线后的新访问开始积累。
ALTER TABLE research_pv_hits ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE research_pv_hits ADD COLUMN user_provider TEXT NOT NULL DEFAULT '';
ALTER TABLE research_pv_hits ADD COLUMN user_name TEXT NOT NULL DEFAULT '';
ALTER TABLE research_pv_hits ADD COLUMN visitor_type TEXT NOT NULL DEFAULT 'anonymous';
ALTER TABLE research_pv_hits ADD COLUMN source TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE research_pv_hits ADD COLUMN medium TEXT NOT NULL DEFAULT 'none';
ALTER TABLE research_pv_hits ADD COLUMN campaign TEXT NOT NULL DEFAULT '';
ALTER TABLE research_pv_hits ADD COLUMN referrer_host TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_research_pv_hits_period_content
  ON research_pv_hits (created_at, category, slug);
CREATE INDEX IF NOT EXISTS idx_research_pv_hits_period_visitor
  ON research_pv_hits (created_at, visitor_type, user_id, visitor_hash);
CREATE INDEX IF NOT EXISTS idx_research_pv_hits_period_source
  ON research_pv_hits (created_at, source, medium);
