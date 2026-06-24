-- 游客管理后台聚合索引
-- 聚合来源复用现有游客身份：guest:<gid>。这些索引只服务读取效率，
-- 不改变账本、余额、评论或绑定语义。
CREATE INDEX IF NOT EXISTS idx_point_ledger_user_created
  ON point_ledger(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_comments_user_created
  ON article_comments(user_id, created_at DESC);
