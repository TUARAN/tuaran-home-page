-- X 每日问候支持模板随机与 DeepSeek Flash 意图生成两种模式。
-- 默认使用 DeepSeek Flash 意图生成；站长仍可在后台切回模板库。
INSERT OR IGNORE INTO site_settings (key, value, updated_at, updated_by)
VALUES
  ('automation.x_morning_greeting.generation_mode', 'llm', strftime('%s', 'now') * 1000, 'migration'),
  (
    'automation.x_morning_greeting.llm_intent',
    '写一条自然、真诚的中文日常问候，可以结合可靠的中华典故、文学名句或生活随想。每天换一个角度，避免营销腔、说教和空泛鸡汤。',
    strftime('%s', 'now') * 1000,
    'migration'
  );
