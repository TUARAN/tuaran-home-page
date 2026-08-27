-- WorkBuddy 只维护资源目录；账号、燃币账本和永久权益复用主站现有表。
-- 以下 IF NOT EXISTS 只用于让独立 Worker 的全新本地 D1 也能启动；线上已有表不会被改写。
CREATE TABLE IF NOT EXISTS point_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_idem ON point_ledger(user_id, reason, ref);

CREATE TABLE IF NOT EXISTS user_points (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gated_resources (
  resource_key TEXT PRIMARY KEY,
  cost_points INTEGER NOT NULL DEFAULT 0,
  min_role TEXT NOT NULL DEFAULT 'guest',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resource_unlocks (
  user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  cost_points INTEGER,
  PRIMARY KEY (user_id, resource_key)
);

CREATE TABLE IF NOT EXISTS resource_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  item_key TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workbuddy_resources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  resource_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  eyebrow TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '效率实战',
  format TEXT NOT NULL DEFAULT 'PDF',
  tags_json TEXT NOT NULL DEFAULT '[]',
  highlights_json TEXT NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT 'lime',
  cost_points INTEGER NOT NULL DEFAULT 5 CHECK (cost_points >= 0),
  page_count INTEGER,
  duration_minutes INTEGER,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workbuddy_resources_listing
  ON workbuddy_resources (status, featured DESC, sort_order DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS workbuddy_files (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  label TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER,
  delivery TEXT NOT NULL DEFAULT 'download' CHECK (delivery IN ('read', 'download', 'both')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (resource_id) REFERENCES workbuddy_resources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workbuddy_files_resource
  ON workbuddy_files (resource_id, sort_order, created_at);

-- 首屏占位目录来自站长提供的文件截图。文件上传到 R2 后再补 workbuddy_files。
INSERT OR IGNORE INTO workbuddy_resources
  (id, slug, resource_key, title, eyebrow, summary, description, category, format, tags_json,
   highlights_json, color, cost_points, page_count, duration_minutes, featured, status,
   sort_order, published_at, updated_at)
VALUES
  ('wb-app-cases', '100-workbuddy-app-cases', 'workbuddy:100-workbuddy-app-cases',
   '100 个 WorkBuddy 应用案例', '从场景出发，把繁琐工作交出去',
   '覆盖信息整理、内容生产、项目推进与个人效率的 WorkBuddy 实战案例集。',
   '用可以直接照做的案例理解 WorkBuddy 能处理哪些工作，以及每类任务该如何开始。',
   '案例合集', 'PDF', '["应用案例","职场效率","入门"]',
   '["100 个真实工作场景","按任务类型快速查找","适合第一次使用 WorkBuddy"]',
   'orange', 5, NULL, NULL, 1, 'published', 100, 1787788800000, 1787788800000),
  ('wb-beginner', 'workbuddy-beginner-guide', 'workbuddy:workbuddy-beginner-guide',
   'WorkBuddy 保姆级入门指南', '5000 字，从入门到精通',
   '把安装、配置、第一次任务和常见问题集中讲清楚。',
   '面向第一次使用 WorkBuddy 的完整起步指南，减少配置和操作中的来回试错。',
   '入门指南', 'PDF', '["新手入门","配置","教程"]',
   '["完整上手路径","关键配置说明","常见问题排查"]',
   'blue', 5, NULL, NULL, 1, 'published', 90, 1787788800000, 1787788800000),
  ('wb-ima', 'workbuddy-ima-knowledge-base', 'workbuddy:workbuddy-ima-knowledge-base',
   '用 WorkBuddy 自动更新、管理 ima 知识库', '告别手动整理 ima',
   '把资料收集、分类整理和知识库更新串成一条自动化流程。',
   '围绕 ima 知识库的日常维护，拆解资料进入、结构整理和持续更新的方法。',
   '知识管理', 'PDF', '["ima","知识库","自动化"]',
   '["资料自动归档","知识库持续更新","内附实操步骤"]',
   'violet', 5, NULL, NULL, 1, 'published', 80, 1787788800000, 1787788800000),
  ('wb-prompts', 'workbuddy-prompt-templates', 'workbuddy:workbuddy-prompt-templates',
   '用 WorkBuddy 做 Prompt：高频职场模板', '让每次输入都有清晰结果',
   '整理高频职场任务的 Prompt 结构与可直接修改的模板。',
   '按沟通、汇报、分析、写作和协作等任务组织模板，方便快速复制后改成自己的工作流。',
   'Prompt 模板', 'PDF', '["Prompt","职场模板","效率"]',
   '["高频职场场景","可直接改写复用","包含结果检查清单"]',
   'pink', 5, NULL, NULL, 0, 'published', 70, 1787788800000, 1787788800000),
  ('wb-automation', 'ima-workbuddy-automation', 'workbuddy:ima-workbuddy-automation',
   'ima 知识库 + WorkBuddy：管理自动化实操', '从资料到知识库的完整链路',
   '用一套完整实操把 WorkBuddy 与 ima 知识库连接起来。',
   '从任务配置到结果检查，集中展示知识管理自动化的实际操作过程。',
   '自动化实操', 'PDF', '["ima","自动化","实操"]',
   '["完整操作流程","关键节点检查","适合照着搭建"]',
   'teal', 5, NULL, NULL, 0, 'published', 60, 1787788800000, 1787788800000),
  ('wb-video', 'workbuddy-workplace-video-course', 'workbuddy:workbuddy-workplace-video-course',
   'WorkBuddy 职场提效应用实战', '从案例到自己的工作流',
   '通过视频演示常用职场任务的配置、执行与优化。',
   '视频教程将结合真实任务展示操作过程，后续会按章节持续补充。',
   '视频教程', '视频', '["视频教程","职场效率","实战"]',
   '["逐步操作演示","真实任务复盘","章节持续更新"]',
   'gold', 10, NULL, NULL, 0, 'published', 50, 1787788800000, 1787788800000);

-- 显式登记价格，便于主站燃币后台统一查看和调整。
INSERT OR IGNORE INTO gated_resources (resource_key, cost_points, min_role, created_at)
SELECT resource_key, cost_points, 'guest', updated_at
FROM workbuddy_resources;
