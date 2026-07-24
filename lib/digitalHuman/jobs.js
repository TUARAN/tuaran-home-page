export const DIGITAL_HUMAN_ACTIVE_STATUSES = ['preparing', 'queued', 'processing']
export const DIGITAL_HUMAN_TERMINAL_STATUSES = ['succeeded', 'failed', 'canceled']

export function isDigitalHumanTerminalStatus(status) {
  return DIGITAL_HUMAN_TERMINAL_STATUSES.includes(String(status || ''))
}

export function rowToDigitalHumanJob(row) {
  if (!row) return null
  const id = String(row.id || '')
  const expiresAt = row.expires_at == null ? null : Number(row.expires_at)
  const resultAvailable =
    row.status === 'succeeded' &&
    row.output_object_key &&
    (!expiresAt || expiresAt > Date.now())
  return {
    id,
    status: row.status || 'failed',
    script: row.script_text || '',
    sourceFileName: row.source_file_name || '',
    provider: row.provider || '',
    providerStatus: row.provider_status || '',
    errorCode: row.error_code || '',
    errorDetail: row.error_detail || '',
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
    completedAt: row.completed_at == null ? null : Number(row.completed_at),
    expiresAt,
    resultUrl: resultAvailable
      ? `/api/digital-human/assets/${encodeURIComponent(id)}/result`
      : '',
  }
}

export async function createDigitalHumanJob(db, {
  id,
  userId,
  script,
  sourceObjectKey,
  sourceFileName,
  sourceContentType,
  audioObjectKey,
  provider,
  now = Date.now(),
}) {
  await db
    .prepare(
      `INSERT INTO digital_human_jobs
        (id, user_id, status, script_text, source_object_key, source_file_name,
         source_content_type, audio_object_key, output_object_key, provider,
         provider_job_id, provider_status, error_code, error_detail, consent_at,
         created_at, updated_at, completed_at, expires_at)
       VALUES
        (?1, ?2, 'preparing', ?3, ?4, ?5, ?6, ?7, '', ?8, '', '', '', '', ?9, ?9, ?9, NULL, NULL)`
    )
    .bind(
      id,
      userId,
      script,
      sourceObjectKey,
      sourceFileName,
      sourceContentType,
      audioObjectKey,
      provider,
      now
    )
    .run()
}

export async function listDigitalHumanJobs(db, userId, limit = 20) {
  const result = await db
    .prepare(
      `SELECT * FROM digital_human_jobs
       WHERE user_id = ?1
       ORDER BY created_at DESC
       LIMIT ?2`
    )
    .bind(userId, Math.min(Math.max(Number(limit) || 20, 1), 50))
    .all()
  return (result?.results || []).map(rowToDigitalHumanJob)
}

export async function getDigitalHumanJob(db, id) {
  return db
    .prepare('SELECT * FROM digital_human_jobs WHERE id = ?1')
    .bind(String(id || '').trim())
    .first()
}

export async function getDigitalHumanJobForUser(db, id, userId) {
  return db
    .prepare('SELECT * FROM digital_human_jobs WHERE id = ?1 AND user_id = ?2')
    .bind(String(id || '').trim(), String(userId || '').trim())
    .first()
}

export async function hasActiveDigitalHumanJob(db, userId) {
  const row = await db
    .prepare(
      `SELECT id FROM digital_human_jobs
       WHERE user_id = ?1 AND status IN ('preparing', 'queued', 'processing')
       LIMIT 1`
    )
    .bind(userId)
    .first()
  return Boolean(row?.id)
}

export async function queueDigitalHumanJob(db, id, providerJobId, providerStatus, now = Date.now()) {
  await db
    .prepare(
      `UPDATE digital_human_jobs SET
         status = 'queued',
         provider_job_id = ?1,
         provider_status = ?2,
         updated_at = ?3
       WHERE id = ?4`
    )
    .bind(providerJobId, providerStatus || 'starting', now, id)
    .run()
}

export async function markDigitalHumanJobProcessing(db, id, providerStatus, now = Date.now()) {
  await db
    .prepare(
      `UPDATE digital_human_jobs SET
         status = 'processing',
         provider_status = ?1,
         updated_at = ?2
       WHERE id = ?3 AND status NOT IN ('succeeded', 'failed', 'canceled')`
    )
    .bind(providerStatus || 'processing', now, id)
    .run()
}

export async function completeDigitalHumanJob(db, id, {
  outputObjectKey,
  providerStatus = 'succeeded',
  now = Date.now(),
  expiresAt,
}) {
  await db
    .prepare(
      `UPDATE digital_human_jobs SET
         status = 'succeeded',
         output_object_key = ?1,
         provider_status = ?2,
         error_code = '',
         error_detail = '',
         updated_at = ?3,
         completed_at = ?3,
         expires_at = ?4
       WHERE id = ?5 AND status != 'canceled'`
    )
    .bind(outputObjectKey, providerStatus, now, expiresAt, id)
    .run()
}

export async function failDigitalHumanJob(db, id, {
  errorCode,
  errorDetail,
  providerStatus = 'failed',
  now = Date.now(),
}) {
  await db
    .prepare(
      `UPDATE digital_human_jobs SET
         status = 'failed',
         provider_status = ?1,
         error_code = ?2,
         error_detail = ?3,
         updated_at = ?4,
         completed_at = ?4
       WHERE id = ?5 AND status NOT IN ('succeeded', 'canceled')`
    )
    .bind(
      String(providerStatus || 'failed').slice(0, 80),
      String(errorCode || 'GENERATION_FAILED').slice(0, 120),
      String(errorDetail || '').slice(0, 1000),
      now,
      id
    )
    .run()
}

export async function cancelDigitalHumanJobRecord(db, id, now = Date.now()) {
  await db
    .prepare(
      `UPDATE digital_human_jobs SET
         status = 'canceled',
         provider_status = 'canceled',
         updated_at = ?1,
         completed_at = ?1
       WHERE id = ?2 AND status NOT IN ('succeeded', 'failed', 'canceled')`
    )
    .bind(now, id)
    .run()
}

export async function deleteDigitalHumanJobRecord(db, id, userId) {
  await db
    .prepare('DELETE FROM digital_human_jobs WHERE id = ?1 AND user_id = ?2')
    .bind(id, userId)
    .run()
}
