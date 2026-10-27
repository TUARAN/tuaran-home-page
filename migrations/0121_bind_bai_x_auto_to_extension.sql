-- B.AI 插件密钥不能作为站内 DeepSeek 任务的全局兜底。
-- 按已核对的记录 ID、名称、掩码和旧绑定限定；重复执行安全。
UPDATE deepseek_keys
SET bound_tasks = '[{"source":"x-reply-clipboard-extension","taskType":""}]',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = '1ce027c3-2fa5-4997-8121-ce109c0734f9'
  AND name = 'bai-x-auto'
  AND key_hint = 'sk-p****e60j'
  AND bound_tasks = '[]';
