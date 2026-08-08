-- 修复 0065 种子把 \n 存成字面字符的问题。
-- SQLite 字符串字面量不把 \n 当作换行转义，0065 写入的行里实际是反斜杠+n 两个字符，
-- 发布到 X 时会出现字面 \n。此迁移把历史数据统一替换为真实换行符（CHAR(10)）。
UPDATE morning_greeting_templates
SET text = REPLACE(text, '\n', CHAR(10)),
    updated_at = strftime('%s', 'now') * 1000
WHERE text LIKE '%\n%';
