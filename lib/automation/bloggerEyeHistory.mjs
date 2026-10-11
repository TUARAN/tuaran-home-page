function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}
function normalizedRun(row) {
  return {
    id: String(row?.id || ''),
    triggerType: String(row?.trigger_type || ''),
    scheduledAt: Number(row?.scheduled_at) || 0,
    completedAt: Number(row?.completed_at) || 0,
    mode: String(row?.mode || ''),
    targetUrl: String(row?.target_url || ''),
    runnerId: String(row?.runner_id || ''),
    runnerLabel: String(row?.runner_label || ''),
    exitIp: String(row?.exit_ip || ''),
    previousExitIp: String(row?.previous_exit_ip || ''),
    ipChanged: row?.ip_changed == null ? null : Number(row.ip_changed) === 1,
    httpStatus: Number(row?.http_status) || 0,
    durationMs: Number(row?.duration_ms) || 0,
    effectiveUrl: String(row?.effective_url || ''),
    error: String(row?.error || ''),
  }
}

export async function getBloggerEyeSchedulerSnapshot(db, limit = 20) {
  if (!db) return { ready: false, history: [], error: 'D1 未绑定' }
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20))

  try {
    const [state, historyResult] = await Promise.all([
      db.prepare(
        `SELECT next_runner_index, last_runner_id, last_exit_ip, updated_at
         FROM blogger_eye_scheduler_state WHERE id = 1`,
      ).first(),
      db.prepare(
        `SELECT id, trigger_type, scheduled_at, completed_at, mode, target_url,
                runner_id, runner_label, exit_ip, previous_exit_ip, ip_changed,
                http_status, duration_ms, effective_url, error
         FROM blogger_eye_runs
         ORDER BY scheduled_at DESC
         LIMIT ?1`,
      ).bind(safeLimit).all(),
    ])
    const history = rows(historyResult).map(normalizedRun)
    return {
      ready: true,
      schedule: '每 20 分钟',
      nextRunnerIndex: Number(state?.next_runner_index) || 0,
      lastRunnerId: String(state?.last_runner_id || ''),
      lastExitIp: String(state?.last_exit_ip || ''),
      updatedAt: Number(state?.updated_at) || 0,
      lastRun: history[0] || null,
      history,
    }
  } catch (error) {
    return {
      ready: false,
      history: [],
      error: /no such table/i.test(String(error?.message || error))
        ? 'D1 迁移 0087 尚未部署'
        : String(error?.message || error),
    }
  }
}
