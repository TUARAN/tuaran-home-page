-- 本站开发管理：GitHub / npm 来源、同步工作项与同步日志。
-- 第一阶段只做只读同步 + 本地看板状态；GitHub 写操作后续再接。

CREATE TABLE IF NOT EXISTS site_dev_sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  repo TEXT NOT NULL DEFAULT '',
  npm_package TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  repo_url TEXT NOT NULL DEFAULT '',
  latest_version TEXT NOT NULL DEFAULT '',
  latest_version_at INTEGER,
  open_issues_count INTEGER NOT NULL DEFAULT 0,
  open_prs_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  last_sync_status TEXT NOT NULL DEFAULT 'never',
  last_sync_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_dev_sources_project
  ON site_dev_sources(project_id, provider);

CREATE INDEX IF NOT EXISTS idx_site_dev_sources_status
  ON site_dev_sources(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS site_dev_work_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  number INTEGER,
  title TEXT NOT NULL,
  body_excerpt TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  local_status TEXT NOT NULL DEFAULT 'inbox',
  priority TEXT NOT NULL DEFAULT 'normal',
  author TEXT NOT NULL DEFAULT '',
  labels_json TEXT NOT NULL DEFAULT '[]',
  url TEXT NOT NULL DEFAULT '',
  milestone TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  external_created_at INTEGER,
  external_updated_at INTEGER,
  external_closed_at INTEGER,
  synced_at INTEGER NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_dev_work_items_project_status
  ON site_dev_work_items(project_id, local_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_dev_work_items_source_type
  ON site_dev_work_items(source_id, type, state);

CREATE INDEX IF NOT EXISTS idx_site_dev_work_items_synced
  ON site_dev_work_items(synced_at DESC);

CREATE TABLE IF NOT EXISTS site_dev_sync_events (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  item_count INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  error_detail TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_site_dev_sync_events_started
  ON site_dev_sync_events(started_at DESC);
