-- 名言池改为站长复核的模型原创短句，不再保留 0057 首次写入的固定公版名言。
-- 仅删除旧种子的稳定 ID；后台手工创建的 UUID 记录不受影响。
DELETE FROM famous_quotes
WHERE id LIKE 'analects-%'
   OR id LIKE 'laozi-%'
   OR id LIKE 'mencius-%'
   OR id LIKE 'zhuangzi-%'
   OR id LIKE 'xunzi-%'
   OR id LIKE 'sunzi-%'
   OR id LIKE 'poetry-%';

DELETE FROM site_settings WHERE key = 'quotes.seed.version';
