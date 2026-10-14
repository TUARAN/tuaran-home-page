-- X 插件手动上传的每日成功动作汇总，按设备、北京时间日期与账号覆盖更新。
CREATE TABLE IF NOT EXISTS x_extension_daily_reports (
  device_id TEXT NOT NULL,
  report_date TEXT NOT NULL,
  account_handle TEXT NOT NULL DEFAULT '',
  comments INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  follows INTEGER NOT NULL DEFAULT 0,
  unfollows INTEGER NOT NULL DEFAULT 0,
  follow_backs INTEGER NOT NULL DEFAULT 0,
  extension_version TEXT NOT NULL DEFAULT '',
  uploaded_at INTEGER NOT NULL,
  PRIMARY KEY (device_id, report_date, account_handle)
);

CREATE INDEX IF NOT EXISTS idx_x_extension_daily_reports_recent
  ON x_extension_daily_reports(report_date DESC, uploaded_at DESC);
