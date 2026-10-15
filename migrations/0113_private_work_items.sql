-- Owner-only work list. Kept separate from the public-facing project portfolio.
CREATE TABLE IF NOT EXISTS planning_work_items (
  id TEXT PRIMARY KEY,
  work_date TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'doing', 'waiting', 'done')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planning_work_items_date_order
  ON planning_work_items (work_date DESC, sort_order ASC);

INSERT OR IGNORE INTO planning_work_items (id, work_date, title, details, status, sort_order, created_at, updated_at) VALUES
  ('work-20261015-training', '2026-10-15', '确认培训时间和各项截止时间，并参加培训', '先核培训通知和各项截止时间；培训按固定时段参加。', 'planned', 10, unixepoch() * 1000, unixepoch() * 1000),
  ('work-20261015-q3-q4', '2026-10-15', '核对 Q3 实绩，再填报 Q4 系统', '用 30 分钟确认 7–9 月交付、验收和本人分工；随后写 Q4 计划并提交系统。', 'planned', 20, unixepoch() * 1000, unixepoch() * 1000),
  ('work-20261015-q3-email', '2026-10-15', '写 Q3 总结邮件', '沿用已核实的 Q3 事实，保持系统和邮件口径一致。', 'planned', 30, unixepoch() * 1000, unixepoch() * 1000),
  ('work-20261015-security', '2026-10-15', '汇总安全自查表', '待提供模板及各项检查结果后汇总。', 'waiting', 40, unixepoch() * 1000, unixepoch() * 1000),
  ('work-20261015-competition', '2026-10-15', '整理自主大赛申报材料', '待提供通知、申报表和证明材料后核对缺项。', 'waiting', 50, unixepoch() * 1000, unixepoch() * 1000);
