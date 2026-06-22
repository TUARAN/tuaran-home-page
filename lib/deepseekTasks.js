import { getD1 } from './d1'

const MAX_SUMMARY_LENGTH = 1200
const MAX_ERROR_LENGTH = 1600
const MAX_METADATA_LENGTH = 5000

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function text(value, maxLength = MAX_SUMMARY_LENGTH) {
  return String(value || '').trim().slice(0, maxLength)
}

function jsonText(value) {
  try {
    return JSON.stringify(value || {}).slice(0, MAX_METADATA_LENGTH)
  } catch {
    return '{}'
  }
}

function usageNumbers(usage) {
  return {
    promptTokens: Math.max(0, Number(usage?.prompt_tokens) || 0),
    completionTokens: Math.max(0, Number(usage?.completion_tokens) || 0),
    totalTokens: Math.max(0, Number(usage?.total_tokens) || 0),
  }
}

/** best-effort：D1 不可用或迁移未部署时不阻断 DeepSeek 主调用。 */
export async function createDeepSeekTask({
  source,
  taskType,
  title,
  actorId,
  actorName,
  model,
  inputSummary,
  metadata,
  startedAt = Date.now(),
} = {}) {
  const db = dbOrNull()
  if (!db) return null

  const id = crypto.randomUUID()
  try {
    await db
      .prepare(
        `INSERT INTO deepseek_tasks
          (id, source, task_type, title, execution_status, management_status, priority,
           actor_id, actor_name, model, input_summary, result_summary, metadata_json,
           prompt_tokens, completion_tokens, total_tokens, duration_ms, error_code,
           error_detail, management_note, started_at, finished_at, created_at, updated_at)
         VALUES
          (?1, ?2, ?3, ?4, 'running', 'pending', 'normal', ?5, ?6, ?7, ?8, '', ?9,
           0, 0, 0, 0, '', '', '', ?10, NULL, ?10, ?10)`,
      )
      .bind(
        id,
        text(source, 100),
        text(taskType, 100),
        text(title, 240),
        text(actorId, 200),
        text(actorName, 200),
        text(model, 160),
        text(inputSummary),
        jsonText(metadata),
        startedAt,
      )
      .run()
    return id
  } catch (error) {
    console.error('createDeepSeekTask failed', error)
    return null
  }
}

export async function finishDeepSeekTask(id, {
  status,
  usage,
  durationMs,
  resultSummary,
  metadata,
  errorCode,
  errorDetail,
  finishedAt = Date.now(),
} = {}) {
  if (!id) return
  const db = dbOrNull()
  if (!db) return
  const tokens = usageNumbers(usage)
  const executionStatus = status === 'succeeded' ? 'succeeded' : 'failed'

  try {
    await db
      .prepare(
        `UPDATE deepseek_tasks SET
           execution_status = ?1,
           prompt_tokens = ?2,
           completion_tokens = ?3,
           total_tokens = ?4,
           duration_ms = CASE WHEN ?5 > 0 THEN ?5 ELSE duration_ms END,
           result_summary = CASE WHEN ?6 != '' THEN ?6 ELSE result_summary END,
           metadata_json = CASE WHEN ?7 != '{}' THEN ?7 ELSE metadata_json END,
           error_code = ?8,
           error_detail = ?9,
           finished_at = ?10,
           updated_at = ?10
         WHERE id = ?11`,
      )
      .bind(
        executionStatus,
        tokens.promptTokens,
        tokens.completionTokens,
        tokens.totalTokens,
        Math.max(0, Number(durationMs) || 0),
        text(resultSummary),
        jsonText(metadata),
        text(errorCode, 160),
        text(errorDetail, MAX_ERROR_LENGTH),
        finishedAt,
        id,
      )
      .run()
  } catch (error) {
    console.error('finishDeepSeekTask failed', error)
  }
}

export async function enrichDeepSeekTask(id, { resultSummary, metadata } = {}) {
  if (!id) return
  const db = dbOrNull()
  if (!db) return
  try {
    await db
      .prepare(
        `UPDATE deepseek_tasks SET
           result_summary = CASE WHEN ?1 != '' THEN ?1 ELSE result_summary END,
           metadata_json = CASE WHEN ?2 != '{}' THEN ?2 ELSE metadata_json END,
           updated_at = ?3
         WHERE id = ?4`,
      )
      .bind(text(resultSummary), jsonText(metadata), Date.now(), id)
      .run()
  } catch (error) {
    console.error('enrichDeepSeekTask failed', error)
  }
}
