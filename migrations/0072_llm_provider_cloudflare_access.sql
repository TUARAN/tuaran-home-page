-- Ollama Provider 支持 Cloudflare Access Service Token 双请求头鉴权。
ALTER TABLE llm_providers ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'none'
  CHECK (auth_type IN ('none', 'bearer', 'cloudflare_access'));
ALTER TABLE llm_providers ADD COLUMN auth_secondary_hint TEXT NOT NULL DEFAULT '';
ALTER TABLE llm_providers ADD COLUMN auth_secondary_cipher TEXT NOT NULL DEFAULT '';

-- 兼容 0071 中已经保存的 Bearer Token。
UPDATE llm_providers SET auth_type = 'bearer' WHERE auth_cipher != '';
