const EXECUTION_STATUSES = new Set(['succeeded', 'failed'])

function text(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function nonNegative(value) {
  return Math.max(0, Number(value) || 0)
}

function timestamp(value, fallback = Date.now()) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback
}

export function normalizeLocalLlmSyncPayload(body, now = Date.now()) {
  const deviceId = text(body?.deviceId, 120)
  const localCallId = text(body?.localCallId, 120)
  const status = text(body?.status, 20)
  const model = text(body?.model, 160)
  if (!deviceId || !localCallId || !EXECUTION_STATUSES.has(status) || !model) {
    return { ok: false, error: 'INVALID_LOCAL_LLM_RECORD' }
  }

  const startedAt = timestamp(body?.startedAt, now)
  const finishedAt = Math.max(startedAt, timestamp(body?.finishedAt, now))
  const promptTokens = nonNegative(body?.promptTokens)
  const completionTokens = nonNegative(body?.completionTokens)
  const providedTotal = nonNegative(body?.totalTokens)

  return {
    ok: true,
    record: {
      deviceId,
      deviceName: text(body?.deviceName, 120) || 'Mac',
      localCallId,
      status,
      model,
      endpoint: text(body?.endpoint, 500),
      inputSummary: text(body?.inputSummary, 1200),
      resultSummary: text(body?.resultSummary, 1200),
      promptTokens,
      completionTokens,
      totalTokens: providedTotal || promptTokens + completionTokens,
      durationMs: nonNegative(body?.durationMs),
      loadDurationMs: nonNegative(body?.loadDurationMs),
      error: text(body?.error, 1600),
      startedAt,
      finishedAt,
    },
  }
}

export async function localLlmTaskId(deviceId, localCallId) {
  const input = new TextEncoder().encode(`${deviceId}:${localCallId}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input))
  const hex = [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `local-${hex.slice(0, 32)}`
}
