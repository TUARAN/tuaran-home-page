import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../../lib/abuseControls'
import { getD1 } from '../../../../lib/d1'
import { getAvatarR2 } from '../../../../lib/r2'
import { getWorkersAi } from '../../../../lib/workersAi'
import { requireDigitalHumanUser } from '../../../../lib/digitalHuman/auth'
import {
  DIGITAL_HUMAN_IMAGE_EXTENSIONS,
  DIGITAL_HUMAN_IMAGE_TYPES,
  DIGITAL_HUMAN_INPUT_URL_TTL_MS,
  DIGITAL_HUMAN_PROVIDER,
  DIGITAL_HUMAN_WEBHOOK_TTL_MS,
  MAX_DIGITAL_HUMAN_IMAGE_BYTES,
  MAX_DIGITAL_HUMAN_SCRIPT_CHARS,
  getDigitalHumanSigningSecret,
  normalizeDigitalHumanScript,
  sanitizeDigitalHumanUserId,
} from '../../../../lib/digitalHuman/config'
import {
  createDigitalHumanJob,
  failDigitalHumanJob,
  getDigitalHumanJobForUser,
  hasActiveDigitalHumanJob,
  listDigitalHumanJobs,
  queueDigitalHumanJob,
  rowToDigitalHumanJob,
} from '../../../../lib/digitalHuman/jobs'
import { submitSadTalkerJob } from '../../../../lib/digitalHuman/replicate'
import { createSignedDigitalHumanUrl } from '../../../../lib/digitalHuman/signing'
import { synthesizeDigitalHumanSpeech } from '../../../../lib/digitalHuman/tts'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const LIST_LIMIT = 20

function dependenciesOrResponse() {
  try {
    return {
      db: getD1(),
      bucket: getAvatarR2(),
      ai: getWorkersAi(),
      signingSecret: getDigitalHumanSigningSecret(),
    }
  } catch (error) {
    return {
      response: Response.json(
        {
          error: 'DIGITAL_HUMAN_UNAVAILABLE',
          message: '数字人口播所需的 D1、私有 R2、Workers AI 或密钥尚未配置。',
          detail: String(error?.message || error),
        },
        { status: 503 }
      ),
    }
  }
}

function generationError(error) {
  const detail = String(error?.message || error)
  if (error?.code === 'PROVIDER_CREDIT_REQUIRED' || detail.includes('REPLICATE_402')) {
    return {
      code: 'PROVIDER_CREDIT_REQUIRED',
      detail: '数字人生成服务余额不足，请充值后重试。',
      status: 402,
    }
  }
  if (detail.includes('REPLICATE_API_TOKEN')) {
    return {
      code: 'PROVIDER_NOT_CONFIGURED',
      detail: '数字人生成服务尚未配置。',
      status: 503,
    }
  }
  if (error?.code || detail.includes('REPLICATE_')) {
    return {
      code: String(error?.code || 'PROVIDER_SUBMIT_FAILED'),
      detail:
        error?.code && !detail.includes('<')
          ? detail.replace(/^REPLICATE_\d+:\s*/, '')
          : '数字人生成服务返回异常，请稍后再试。',
      status: 502,
    }
  }
  if (detail.includes('TTS_') || detail.includes('WORKERS_AI')) {
    return { code: 'TTS_FAILED', detail: '中文语音生成失败，请稍后再试。', status: 502 }
  }
  return {
    code: 'GENERATION_SETUP_FAILED',
    detail: '数字人口播任务创建失败，请稍后再试。',
    status: 502,
  }
}

export async function GET(req) {
  const auth = await requireDigitalHumanUser(req)
  if (auth.response) return auth.response

  const deps = dependenciesOrResponse()
  if (deps.response) return deps.response

  try {
    const jobs = await listDigitalHumanJobs(deps.db, auth.userId, LIST_LIMIT)
    return Response.json({
      status: 'ok',
      accessMode: auth.isOwner ? 'owner' : 'authed',
      limits: {
        maxScriptChars: MAX_DIGITAL_HUMAN_SCRIPT_CHARS,
        maxImageBytes: MAX_DIGITAL_HUMAN_IMAGE_BYTES,
        dailyJobs: auth.isOwner ? 20 : 2,
      },
      jobs,
    })
  } catch (error) {
    const detail = String(error?.message || error)
    return Response.json(
      {
        error: detail.includes('no such table') ? 'MIGRATION_REQUIRED' : 'JOBS_FETCH_FAILED',
        detail,
      },
      { status: detail.includes('no such table') ? 503 : 500 }
    )
  }
}

export async function POST(req) {
  const auth = await requireDigitalHumanUser(req)
  if (auth.response) return auth.response

  const deps = dependenciesOrResponse()
  if (deps.response) return deps.response
  const { db, bucket, ai, signingSecret } = deps

  let form
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'INVALID_FORM' }, { status: 400 })
  }

  const file = form.get('file')
  const script = normalizeDigitalHumanScript(form.get('script'))
  const consent = String(form.get('consent') || '') === 'true'

  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'IMAGE_REQUIRED', message: '请上传一张人物照片。' }, { status: 400 })
  }
  if (!DIGITAL_HUMAN_IMAGE_TYPES.has(file.type || '')) {
    return Response.json(
      { error: 'UNSUPPORTED_IMAGE_TYPE', detail: file.type || '' },
      { status: 415 }
    )
  }
  if (file.size > MAX_DIGITAL_HUMAN_IMAGE_BYTES) {
    return Response.json(
      { error: 'IMAGE_TOO_LARGE', maxBytes: MAX_DIGITAL_HUMAN_IMAGE_BYTES },
      { status: 413 }
    )
  }
  if (!script) {
    return Response.json({ error: 'SCRIPT_REQUIRED', message: '请输入需要人物朗读的文案。' }, { status: 400 })
  }
  if (script.length > MAX_DIGITAL_HUMAN_SCRIPT_CHARS) {
    return Response.json(
      { error: 'SCRIPT_TOO_LONG', maxChars: MAX_DIGITAL_HUMAN_SCRIPT_CHARS },
      { status: 400 }
    )
  }
  if (!consent) {
    return Response.json(
      { error: 'CONSENT_REQUIRED', message: '请确认你拥有该人物肖像与内容的使用权。' },
      { status: 400 }
    )
  }

  try {
    if (await hasActiveDigitalHumanJob(db, auth.userId)) {
      return Response.json(
        { error: 'ACTIVE_JOB_EXISTS', message: '当前已有一个任务正在生成，请等待它完成。' },
        { status: 409 }
      )
    }

    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      {
        scope: 'digital-human:create:user:hour',
        subject: auth.userId,
        limit: auth.isOwner ? 10 : 1,
        windowMs: HOUR_MS,
      },
      {
        scope: 'digital-human:create:user:day',
        subject: auth.userId,
        limit: auth.isOwner ? 20 : 2,
        windowMs: DAY_MS,
      },
      {
        scope: 'digital-human:create:ip:day',
        subject: ip,
        limit: auth.isOwner ? 30 : 4,
        windowMs: DAY_MS,
      },
    ])
    if (!limit.ok) return rateLimitResponse(limit)
  } catch (error) {
    const detail = String(error?.message || error)
    return Response.json(
      { error: detail.includes('no such table') ? 'MIGRATION_REQUIRED' : 'JOB_CHECK_FAILED', detail },
      { status: detail.includes('no such table') ? 503 : 500 }
    )
  }

  const id = crypto.randomUUID()
  const safeUserId = sanitizeDigitalHumanUserId(auth.userId)
  const prefix = `digital-human/${safeUserId}/${id}`
  const extension = DIGITAL_HUMAN_IMAGE_EXTENSIONS[file.type] || 'bin'
  const sourceObjectKey = `${prefix}/source.${extension}`
  const audioObjectKey = `${prefix}/speech.mp3`
  let recordCreated = false

  try {
    await createDigitalHumanJob(db, {
      id,
      userId: auth.userId,
      script,
      sourceObjectKey,
      sourceFileName: file.name || `source.${extension}`,
      sourceContentType: file.type,
      audioObjectKey,
      provider: DIGITAL_HUMAN_PROVIDER,
    })
    recordCreated = true

    await bucket.put(sourceObjectKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'private, no-store, max-age=0',
      },
    })

    const audio = await synthesizeDigitalHumanSpeech(ai, script)
    await bucket.put(audioObjectKey, audio, {
      httpMetadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'private, no-store, max-age=0',
      },
    })

    const origin = new URL(req.url).origin
    const inputExpires = Date.now() + DIGITAL_HUMAN_INPUT_URL_TTL_MS
    const sourceImageUrl = await createSignedDigitalHumanUrl(
      origin,
      `/api/digital-human/assets/${encodeURIComponent(id)}/source`,
      signingSecret,
      { purpose: 'asset', jobId: id, kind: 'source', expires: inputExpires }
    )
    const drivenAudioUrl = await createSignedDigitalHumanUrl(
      origin,
      `/api/digital-human/assets/${encodeURIComponent(id)}/audio`,
      signingSecret,
      { purpose: 'asset', jobId: id, kind: 'audio', expires: inputExpires }
    )
    const webhookExpires = Date.now() + DIGITAL_HUMAN_WEBHOOK_TTL_MS
    const webhookUrl = await createSignedDigitalHumanUrl(
      origin,
      `/api/digital-human/webhooks/replicate?job=${encodeURIComponent(id)}`,
      signingSecret,
      { purpose: 'webhook', jobId: id, kind: 'replicate', expires: webhookExpires }
    )

    const prediction = await submitSadTalkerJob({
      sourceImageUrl,
      drivenAudioUrl,
      webhookUrl,
    })
    if (!prediction?.id) throw new Error('REPLICATE_MISSING_PREDICTION_ID')

    await queueDigitalHumanJob(db, id, prediction.id, prediction.status)
    await cleanupRateLimits(db).catch(() => {})
    const row = await getDigitalHumanJobForUser(db, id, auth.userId)
    return Response.json({ ok: true, job: rowToDigitalHumanJob(row) }, { status: 202 })
  } catch (error) {
    const normalized = generationError(error)
    if (recordCreated) {
      await failDigitalHumanJob(db, id, {
        errorCode: normalized.code,
        errorDetail: normalized.detail,
      }).catch(() => {})
    }
    await Promise.all([
      bucket.delete(sourceObjectKey).catch(() => {}),
      bucket.delete(audioObjectKey).catch(() => {}),
    ])
    return Response.json(
      {
        error: normalized.code,
        message: '数字人口播任务创建失败，请稍后再试。',
        detail: normalized.detail,
      },
      { status: normalized.status || 502 }
    )
  }
}
