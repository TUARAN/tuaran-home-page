-- 2026 FIFA World Cup 数据
-- 采集器由 app/api/wc/collect/route.js 触发,定时把 openfootball/worldcup.json 数据写进这里。
-- 页面 (/agent-world-cup) 走 /api/wc/data 读这五张表。
-- meta 表用来挂"最后更新时间、来源、是否降级"。

-- 比赛主表:104 场(小组赛 72 + 淘汰赛 32)
-- status: NS=未开赛 / 1H/2H/HT/LIVE=进行中 / FT=已结束 / AET/PST=点球或加时
CREATE TABLE IF NOT EXISTS wc_matches (
  fixture_id INTEGER PRIMARY KEY,           -- openfootball match num (稳定场次号)
  league_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  round TEXT NOT NULL DEFAULT '',           -- 'Group A' / 'Round of 16' / 'Quarter-Finals' / 'Semi-Finals' / 'Final'
  group_label TEXT NOT NULL DEFAULT '',     -- 'A'..'L',淘汰赛时为空
  match_date TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  match_time TEXT NOT NULL,                 -- 'HH:MM'
  match_timestamp INTEGER NOT NULL,         -- unix seconds,便于排序
  venue TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  home_team_id INTEGER NOT NULL,
  home_team TEXT NOT NULL DEFAULT '',
  home_flag TEXT NOT NULL DEFAULT '',
  away_team_id INTEGER NOT NULL,
  away_team TEXT NOT NULL DEFAULT '',
  away_flag TEXT NOT NULL DEFAULT '',
  status_short TEXT NOT NULL DEFAULT 'NS',  -- NS / 1H / 2H / HT / FT / AET / PEN ...
  status_long TEXT NOT NULL DEFAULT '',
  status_elapsed INTEGER NOT NULL DEFAULT 0,
  home_goals INTEGER,
  away_goals INTEGER,
  home_goals_et INTEGER,
  away_goals_et INTEGER,
  home_goals_pen INTEGER,
  away_goals_pen INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wc_matches_date ON wc_matches (match_date);
CREATE INDEX IF NOT EXISTS idx_wc_matches_group ON wc_matches (group_label);
CREATE INDEX IF NOT EXISTS idx_wc_matches_round ON wc_matches (round);
CREATE INDEX IF NOT EXISTS idx_wc_matches_status ON wc_matches (status_short);

-- 12 组 × 4 队 积分榜
-- rank: 1..4;每组只存一支队的一行
CREATE TABLE IF NOT EXISTS wc_standings (
  group_label TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  team_flag TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  win INTEGER NOT NULL DEFAULT 0,
  draw INTEGER NOT NULL DEFAULT 0,
  lose INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_diff INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (group_label, team_id)
);

CREATE INDEX IF NOT EXISTS idx_wc_standings_group ON wc_standings (group_label, rank);

-- 射手榜 (Top 20-30)
CREATE TABLE IF NOT EXISTS wc_scorers (
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL DEFAULT '',
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  team_flag TEXT NOT NULL DEFAULT '',
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  penalties INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (player_id)
);

CREATE INDEX IF NOT EXISTS idx_wc_scorers_goals ON wc_scorers (goals DESC);

-- 助攻榜
CREATE TABLE IF NOT EXISTS wc_assists (
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL DEFAULT '',
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  team_flag TEXT NOT NULL DEFAULT '',
  assists INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (player_id)
);

CREATE INDEX IF NOT EXISTS idx_wc_assists_count ON wc_assists (assists DESC);

-- 红黄牌
-- type: 'yellow' / 'red' / 'yellow_red'(第二黄变红)
CREATE TABLE IF NOT EXISTS wc_cards (
  player_id INTEGER NOT NULL,
  player_name TEXT NOT NULL DEFAULT '',
  team_id INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  team_flag TEXT NOT NULL DEFAULT '',
  card_type TEXT NOT NULL DEFAULT 'yellow',
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, card_type)
);

CREATE INDEX IF NOT EXISTS idx_wc_cards_count ON wc_cards (count DESC);

-- 元信息: 采集器健康状态、最后更新时间
CREATE TABLE IF NOT EXISTS wc_meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

-- 初始化 meta 行(采集器会覆盖)
INSERT OR IGNORE INTO wc_meta (k, v, updated_at) VALUES
  ('last_collect_at', '0', 0),
  ('last_collect_status', 'never', 0),
  ('last_collect_error', '', 0),
  ('data_source', 'openfootball', 0);
