-- 燃币默认价已改由 site_settings 的全站规则维护。
-- 0043 中为两项工具包写入的 10 燃币默认覆盖会阻止以后统一调价，
-- 因此仅删除仍保持旧默认值且允许游客解锁的旧记录；人工改过的例外价保留。
DELETE FROM gated_resources
 WHERE resource_key IN ('resource:x-mutual-cleaner-extension', 'resource:2aran-desktop')
   AND cost_points = 10
   AND min_role = 'guest';
