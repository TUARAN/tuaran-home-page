-- 加密分享后台明文管理：
-- owner 后台可直接查看 content；公开分享接口仍只返回 envelope 密文信封。
ALTER TABLE shared_notes
  ADD COLUMN content TEXT NOT NULL DEFAULT '';
