-- 端到端加密分享：站长把任意 markdown 加密后存到这张表，访问者用密码解密。
--
-- 安全模型：
--  - 服务器只存密文信封（envelope = AES-GCM(plaintext, PBKDF2(password, salt))）
--  - 密码永远不落库；URL 里只有 slug（密文 id），密码在 URL hash 或手动输入
--  - 即使站长本人也看不到明文（除非记得密码）
--
-- 唯一写入入口：/api/admin/share（仅 owner）
-- 公共读取入口：/api/share/[slug]（任何人都能拿到密文，但解不开没用）
CREATE TABLE IF NOT EXISTS shared_notes (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  envelope TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at INTEGER,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_shared_notes_created_at
  ON shared_notes (created_at DESC);
