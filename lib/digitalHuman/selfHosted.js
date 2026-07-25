import {
  getSelfHostedSadTalkerBaseUrl,
  getSelfHostedSadTalkerToken,
} from './config'
import { normalizeDigitalHumanProviderError } from './errors'

async function selfHostedRequest(path, options = {}) {
  const response = await fetch(`${getSelfHostedSadTalkerBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSelfHostedSadTalkerToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    const normalized = normalizeDigitalHumanProviderError({
      status: response.status,
      detail: data?.detail || data?.message || text,
    })
    const error = new Error(`SADTALKER_${response.status}: ${normalized.detail}`)
    error.code = normalized.code
    error.status = response.status
    throw error
  }
  return data
}

function normalizeJob(data) {
  if (!data) return data
  return {
    ...data,
    id: String(data.id || data.job_id || ''),
    status: String(data.status || ''),
    output: data.output || data.output_url || '',
  }
}

export async function submitSelfHostedSadTalkerJob({
  sourceImageUrl,
  drivenAudioUrl,
  webhookUrl,
}) {
  return normalizeJob(await selfHostedRequest('/v1/jobs', {
    method: 'POST',
    body: JSON.stringify({
      source_image_url: sourceImageUrl,
      driven_audio_url: drivenAudioUrl,
      webhook_url: webhookUrl,
      options: {
        enhancer: 'gfpgan',
        preprocess: 'full',
        still: true,
      },
    }),
  }))
}

export async function getSelfHostedSadTalkerJob(jobId) {
  return normalizeJob(await selfHostedRequest(`/v1/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
  }))
}

export async function cancelSelfHostedSadTalkerJob(jobId) {
  return normalizeJob(await selfHostedRequest(`/v1/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
    body: '{}',
  }))
}

export function getSelfHostedOutputFetchOptions() {
  return {
    headers: {
      Authorization: `Bearer ${getSelfHostedSadTalkerToken()}`,
    },
  }
}
