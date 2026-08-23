-- 每日问候模板收敛为三个固定编辑位：早安、午安、晚安各一条。
-- 保留每个时段现有排序最前的模板，避免覆盖站长已经修改过的文案。
DELETE FROM morning_greeting_templates
WHERE id NOT IN (
  SELECT MIN(id)
  FROM morning_greeting_templates
  GROUP BY period
);

UPDATE morning_greeting_templates
SET enabled = 1,
    sort_order = CASE period
      WHEN 'morning' THEN 0
      WHEN 'noon' THEN 1
      WHEN 'evening' THEN 2
      ELSE sort_order
    END,
    updated_at = 1787443200000;

CREATE UNIQUE INDEX IF NOT EXISTS idx_morning_greeting_templates_one_per_period
ON morning_greeting_templates (period);
