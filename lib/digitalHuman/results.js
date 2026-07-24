import { validatePublicHttpUrl } from '../abuseControls'
import { DIGITAL_HUMAN_RESULT_RETENTION_MS } from './config'
import { normalizeDigitalHumanProviderError } from './errors'
import {
  completeDigitalHumanJob,
  failDigitalHumanJob,
  markDigitalHumanJobProcessing,
} from './jobs'

function predictionOutputUrl(prediction) {
  if (typeof prediction?.output === 'string') return prediction.output
  if (Array.isArray(prediction?.output)) {
    return prediction.output.find((value) => typeof value === 'string') || ''
  }
  if (typeof prediction?.output?.url === 'string') return prediction.output.url
  return ''
}

function isAllowedReplicateOutputUrl(raw) {
  const checked = validatePublicHttpUrl(raw)
  if (!checked.ok) return checked
  const hostname = new URL(checked.url).hostname.toLowerCase()
  if (
    hostname !== 'replicate.delivery' &&
    !hostname.endsWith('.replicate.delivery') &&
    hostname !== 'replicate.com' &&
    !hostname.endsWith('.replicate.com')
  ) {
    return { ok: false, error: 'OUTPUT_HOST_NOT_ALLOWED' }
  }
  return checked
}

export async function cleanupDigitalHumanInputs(bucket, job) {
  const keys = [job?.source_object_key, job?.audio_object_key].filter(Boolean)
  await Promise.all(keys.map((key) => bucket.delete(key).catch(() => {})))
}

export async function applyReplicatePrediction({ db, bucket, job, prediction }) {
  if (!job || !prediction) return job
  if (job.provider_job_id && prediction.id && job.provider_job_id !== prediction.id) {
    throw new Error('PROVIDER_JOB_MISMATCH')
  }
  if (job.status === 'canceled' || job.status === 'succeeded') return job

  const providerStatus = String(prediction.status || '').toLowerCase()
  if (providerStatus === 'starting' || providerStatus === 'processing') {
    await markDigitalHumanJobProcessing(db, job.id, providerStatus)
    return job
  }

  if (providerStatus === 'succeeded') {
    const output = isAllowedReplicateOutputUrl(predictionOutputUrl(prediction))
    if (!output.ok) {
      await failDigitalHumanJob(db, job.id, {
        errorCode: output.error || 'PROVIDER_OUTPUT_MISSING',
        errorDetail: '数字人服务没有返回可保存的视频。',
        providerStatus,
      })
      await cleanupDigitalHumanInputs(bucket, job)
      return job
    }

    const response = await fetch(output.url)
    if (!response.ok || !response.body) {
      await failDigitalHumanJob(db, job.id, {
        errorCode: 'PROVIDER_OUTPUT_FETCH_FAILED',
        errorDetail: `HTTP_${response.status}`,
        providerStatus,
      })
      return job
    }

    const sourcePrefix = String(job.source_object_key || '').split('/').slice(0, -1).join('/')
    const outputObjectKey = `${sourcePrefix || `digital-human/${job.id}`}/result.mp4`
    await bucket.put(outputObjectKey, response.body, {
      httpMetadata: {
        contentType: response.headers.get('content-type') || 'video/mp4',
        cacheControl: 'private, no-store, max-age=0',
      },
      customMetadata: {
        provider: job.provider || 'replicate-sadtalker',
        providerJobId: job.provider_job_id || prediction.id || '',
      },
    })
    const now = Date.now()
    await completeDigitalHumanJob(db, job.id, {
      outputObjectKey,
      providerStatus,
      now,
      expiresAt: now + DIGITAL_HUMAN_RESULT_RETENTION_MS,
    })
    await cleanupDigitalHumanInputs(bucket, job)
    return job
  }

  if (['failed', 'canceled', 'aborted'].includes(providerStatus)) {
    const failure = normalizeDigitalHumanProviderError({
      detail: prediction.error || '',
    })
    await failDigitalHumanJob(db, job.id, {
      errorCode:
        providerStatus === 'canceled'
          ? 'PROVIDER_CANCELED'
          : failure.code,
      errorDetail:
        providerStatus === 'canceled'
          ? '数字人口播任务已被取消。'
          : failure.detail,
      providerStatus,
    })
    await cleanupDigitalHumanInputs(bucket, job)
  }

  return job
}
