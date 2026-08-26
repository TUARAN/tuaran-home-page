-- 名言生成改为可追溯的自动化名言池；前台从 enabled 记录中随机展示。
ALTER TABLE famous_quotes ADD COLUMN generation_prompt TEXT NOT NULL DEFAULT '';
ALTER TABLE famous_quotes ADD COLUMN generation_trigger TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE famous_quotes ADD COLUMN generation_model TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_famous_quotes_trigger_created
  ON famous_quotes(generation_trigger, created_at DESC);
