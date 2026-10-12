-- 将 2026-10-12 核对过的三个站外插件专用 Key 从旧的 engagement-bot 绑定迁走。
-- engagement-bot 保留给站内评论机器人；按 ID、名称和原绑定同时限定，重复执行安全。
UPDATE deepseek_keys
SET bound_tasks = '[{"source":"juejin-interaction-extension","taskType":""}]',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = '1accc641-eca3-4f25-a627-5a57b4934a11'
  AND name = 'DSF-juejin'
  AND bound_tasks = '[{"source":"engagement-bot","taskType":""}]';

UPDATE deepseek_keys
SET bound_tasks = '[{"source":"x-reply-clipboard-extension","taskType":""}]',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = '6917dadd-0946-405e-82ff-989a87a8289b'
  AND name = 'DSF-X'
  AND bound_tasks = '[{"source":"engagement-bot","taskType":""}]';

UPDATE deepseek_keys
SET bound_tasks = '[{"source":"xhs-interaction-extension","taskType":""}]',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'dc8cc217-c400-4b87-8fcd-dbfba38d8f37'
  AND name = 'DSF-xhs'
  AND bound_tasks = '[{"source":"engagement-bot","taskType":""}]';
