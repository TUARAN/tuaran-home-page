-- 2026-10-01 08:00（北京时间）D1 免费额度重置后的恢复清单。
-- Cloudflare Pages、D1 与 GitHub Actions 都无需人工重启；历史失败运行不会自动补跑。

INSERT OR IGNORE INTO planning_directions
  (id, title, description, north_star, status, priority, start_at, target_at, completed_at, sort_order, archived_at, created_at, updated_at)
VALUES
  ('direction:blog', '个人门户', '个人门户、知识资产与共享内容基础设施。', '保证内容、身份与自动化链路稳定运行。', 'active', 'high', NULL, NULL, NULL, 0, NULL, 1790726400000, 1790726400000);

INSERT OR IGNORE INTO planning_project_profiles
  (id, project_id, direction_id, summary, planning_status, is_focus, start_at, target_at, sort_order, archived_at, created_at, updated_at)
SELECT
  'profile:tuaran-home-page', 'tuaran-home-page', 'direction:blog',
  '个人门户、调研知识库与站内自动化。', 'active', 1, NULL, NULL, 0, NULL,
  1790726400000, 1790726400000
WHERE EXISTS (SELECT 1 FROM portfolio_projects WHERE id = 'tuaran-home-page');

INSERT OR IGNORE INTO planning_milestones
  (id, direction_id, project_id, title, description, success_criteria, status, priority, start_at, target_at, completed_at, source_key, sort_order, archived_at, created_at, updated_at)
SELECT
  'milestone:d1-quota-recovery-2026-10-01', profile.direction_id, profile.project_id,
  'D1 配额恢复检查（2026-10-01）',
  '北京时间 08:00 配额自动重置。Pages、D1 和 GitHub Actions 无需重启；先观察自动调度，只补跑仍然失败的单个任务。',
  'D1 可写；0103 已应用且 x_reply_tasks 表可用；X 自动发布与舆情采集各出现一次成功运行；09:00 与 12:00 写入曲线无异常；0100 全量迁移没有再次执行。',
  'active', 'critical', 1790812800000, 1790827200000, NULL,
  'incident:d1-quota-recovery:2026-10-01', -100, NULL, 1790726400000, 1790726400000
FROM planning_project_profiles profile
WHERE profile.project_id = 'tuaran-home-page'
  AND profile.archived_at IS NULL
LIMIT 1;

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-write-check', milestone.id,
  '08:00｜确认 D1 已恢复写入',
  '打开 Cloudflare D1 用量与 Query insights，确认当日写入计数已从新额度开始；再刷新站点健康页。完成这条待办本身也会产生一次很小的 D1 写入。',
  'planned', 'critical', 'TUARAN', 1790812800000, NULL, 1790813400000, NULL,
  '若仍返回 daily row write limit，先等待 5—10 分钟并再次检查 UTC 日期；不要重跑 0100_fixed_ranbi_supply.sql。',
  '', 10, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-x-reply-migration', milestone.id,
  '08:05｜应用 X 回复任务迁移 0103',
  '确认 D1 已恢复写入后，应用 0103_x_reply_tasks.sql；随后打开 /admin/x-replies，确认页面不再提示迁移缺失，并能保存一条待确认任务。不要在额度恢复前反复执行。',
  'planned', 'critical', 'TUARAN', 1790812800000, NULL, 1790813700000, NULL,
  '只应用 0103_x_reply_tasks.sql，不要重跑 0100_fixed_ranbi_supply.sql。先验证建表与保存草稿，不要为了验收直接向 X 发布回复。',
  '', 15, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-x-auto-post', milestone.id,
  '08:10｜观察 X 自动发布自行恢复',
  'GitHub Actions 会继续按每 5 分钟计划检查待发布槽位，无需启动服务。先确认 morning-greeting 工作流成功并在 X 出现新帖；只有自动运行仍失败时才手动补跑一个槽位。',
  'planned', 'high', 'TUARAN', 1790812800000, NULL, 1790814000000, NULL,
  '历史失败任务不会自动重放。不要一次补跑多个时段，避免恢复瞬间形成写入尖峰或重复发帖。',
  '', 20, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-public-opinion', milestone.id,
  '08:17｜观察舆情采集自行恢复',
  '等待 public-opinion-collect 的整点后第 17 分钟自动运行，确认 HTTP 200。自动运行成功就不补跑；失败时只手动运行一次并保存响应。',
  'planned', 'high', 'TUARAN', 1790812800000, NULL, 1790814600000, NULL,
  '若仍是配额错误，保留日志并继续等待；若变成其他错误，再按响应内容排查密钥、上游源或接口。',
  '', 30, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-first-hour-budget', milestone.id,
  '09:00｜检查首小时 D1 写入增量',
  '查看账号级 D1 写入量和 tuaran-me 的 Top queries。首小时建议控制在 10,000 行以内，并确认没有再次出现全量 user_points 更新。',
  'planned', 'critical', 'TUARAN', 1790812800000, NULL, 1790816400000, NULL,
  '若首小时超过 10,000 行，先暂停舆情、互动机器人等可补跑采集，保留登录、内容发布和权益链路，再按 rows_written 排查。',
  '', 40, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';

INSERT OR IGNORE INTO planning_tasks
  (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
SELECT
  'task:d1-recovery-noon-review', milestone.id,
  '12:00｜完成半日恢复复查',
  '确认 X、舆情采集、登录与核心站内写入正常；核对累计写入量、Top queries 和失败告警，再决定是否恢复任何被暂停的非关键任务。',
  'planned', 'high', 'TUARAN', 1790812800000, NULL, 1790827200000, NULL,
  '半日累计建议低于 25,000 行。满足成功标准后，将五条任务和里程碑标记完成。',
  '', 50, NULL, 1790726400000, 1790726400000
FROM planning_milestones milestone
WHERE milestone.id = 'milestone:d1-quota-recovery-2026-10-01';
