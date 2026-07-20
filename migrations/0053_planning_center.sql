CREATE TABLE IF NOT EXISTS planning_directions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  north_star TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  start_at INTEGER,
  target_at INTEGER,
  completed_at INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS planning_project_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  direction_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  planning_status TEXT NOT NULL DEFAULT 'active' CHECK (planning_status IN ('active', 'paused', 'archived')),
  is_focus INTEGER NOT NULL DEFAULT 0 CHECK (is_focus IN (0, 1)),
  start_at INTEGER,
  target_at INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (direction_id) REFERENCES planning_directions(id) ON DELETE RESTRICT,
  UNIQUE (direction_id, project_id)
);

CREATE TABLE IF NOT EXISTS planning_milestones (
  id TEXT PRIMARY KEY,
  direction_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  success_criteria TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'blocked', 'completed', 'cancelled', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  start_at INTEGER,
  target_at INTEGER,
  completed_at INTEGER,
  source_key TEXT UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (direction_id, project_id)
    REFERENCES planning_project_profiles(direction_id, project_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS planning_tasks (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'doing', 'blocked', 'done', 'cancelled', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  assignee TEXT NOT NULL DEFAULT '',
  planned_at INTEGER,
  start_at INTEGER,
  target_at INTEGER,
  completed_at INTEGER,
  note TEXT NOT NULL DEFAULT '',
  blocked_reason TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (milestone_id) REFERENCES planning_milestones(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS planning_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  source_key TEXT UNIQUE,
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS planning_decisions (
  id TEXT PRIMARY KEY,
  direction_id TEXT,
  project_id TEXT,
  milestone_id TEXT,
  title TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  conclusion TEXT,
  rationale TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('open', 'decided', 'superseded')),
  decided_at INTEGER,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (direction_id) REFERENCES planning_directions(id) ON DELETE RESTRICT,
  FOREIGN KEY (project_id) REFERENCES planning_project_profiles(project_id) ON DELETE RESTRICT,
  FOREIGN KEY (milestone_id) REFERENCES planning_milestones(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS planning_dependencies (
  id TEXT PRIMARY KEY,
  from_type TEXT NOT NULL CHECK (from_type IN ('milestone', 'task')),
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL CHECK (to_type IN ('milestone', 'task')),
  to_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'depends_on',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (from_type, from_id, to_type, to_id)
);

CREATE INDEX IF NOT EXISTS idx_planning_project_profiles_direction
  ON planning_project_profiles (direction_id);
CREATE INDEX IF NOT EXISTS idx_planning_milestones_direction_project
  ON planning_milestones (direction_id, project_id);
CREATE INDEX IF NOT EXISTS idx_planning_milestones_status_target
  ON planning_milestones (status, target_at);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_milestone
  ON planning_tasks (milestone_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_status_target
  ON planning_tasks (status, target_at);
CREATE INDEX IF NOT EXISTS idx_planning_events_occurred
  ON planning_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_planning_decisions_decided
  ON planning_decisions (decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_planning_dependencies_from
  ON planning_dependencies (from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_planning_dependencies_to
  ON planning_dependencies (to_type, to_id);
