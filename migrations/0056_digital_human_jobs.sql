-- 数字人口播（/tools/digital-human）
-- 人脸照片、临时语音与生成视频存放在私有 R2 桶 AVATAR_MEDIA。
-- D1 只保存任务归属、供应商状态和对象 key；所有媒体读取均经站内鉴权或短期签名 URL。
CREATE TABLE IF NOT EXISTS digital_human_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing'
    CHECK (status IN ('preparing', 'queued', 'processing', 'succeeded', 'failed', 'canceled')),
  script_text TEXT NOT NULL,
  source_object_key TEXT NOT NULL DEFAULT '',
  source_file_name TEXT NOT NULL DEFAULT '',
  source_content_type TEXT NOT NULL DEFAULT '',
  audio_object_key TEXT NOT NULL DEFAULT '',
  output_object_key TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'replicate-sadtalker',
  provider_job_id TEXT NOT NULL DEFAULT '',
  provider_status TEXT NOT NULL DEFAULT '',
  error_code TEXT NOT NULL DEFAULT '',
  error_detail TEXT NOT NULL DEFAULT '',
  consent_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_digital_human_jobs_user_created
  ON digital_human_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_digital_human_jobs_provider_job
  ON digital_human_jobs (provider, provider_job_id);

CREATE INDEX IF NOT EXISTS idx_digital_human_jobs_status_updated
  ON digital_human_jobs (status, updated_at);
