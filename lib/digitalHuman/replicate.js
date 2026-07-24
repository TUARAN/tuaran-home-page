import {
  getReplicateApiToken,
  getReplicateSadTalkerVersion,
} from './config'
import { normalizeDigitalHumanProviderError } from './errors'

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

async function replicateRequest(path, options = {}) {
  const response = await fetch(`${REPLICATE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getReplicateApiToken()}`,
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
      detail: data?.detail || data?.title || text,
    })
    const error = new Error(`REPLICATE_${response.status}: ${normalized.detail}`)
    error.code = normalized.code
    error.status = response.status
    throw error
  }
  return data
}

export async function submitSadTalkerJob({
  sourceImageUrl,
  drivenAudioUrl,
  webhookUrl,
}) {
  return replicateRequest('/predictions', {
    method: 'POST',
    body: JSON.stringify({
      version: getReplicateSadTalkerVersion(),
      input: {
        source_image: sourceImageUrl,
        driven_audio: drivenAudioUrl,
        enhancer: 'gfpgan',
        preprocess: 'full',
        still: true,
      },
      webhook: webhookUrl,
      webhook_events_filter: ['completed'],
    }),
  })
}

export async function getReplicatePrediction(predictionId) {
  return replicateRequest(`/predictions/${encodeURIComponent(predictionId)}`, {
    method: 'GET',
  })
}

export async function cancelReplicatePrediction(predictionId) {
  return replicateRequest(`/predictions/${encodeURIComponent(predictionId)}/cancel`, {
    method: 'POST',
    body: '{}',
  })
}
