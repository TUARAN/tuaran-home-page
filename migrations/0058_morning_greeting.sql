-- X 每日早安问候自动化：默认运行中，站长可在后台「自动化控制台」一键暂停/恢复。
INSERT OR IGNORE INTO site_settings (key, value, updated_at, updated_by)
VALUES ('automation.x_morning_greeting', 'running', strftime('%s', 'now') * 1000, 'migration');
