-- 公司池快照改为单行存储完整 JSON（免费计划 D1 每次调用限 50 个查询，
-- 逐行 INSERT 5000+ 家公司会超限）；a_share_pool 表保留但不参与写入。
ALTER TABLE a_share_pool_snapshot ADD COLUMN content TEXT NOT NULL DEFAULT '';
