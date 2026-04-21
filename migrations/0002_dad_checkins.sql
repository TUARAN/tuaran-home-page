CREATE TABLE IF NOT EXISTS dad_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_dad_checkins_user_month ON dad_checkins (user_id, checkin_date);
