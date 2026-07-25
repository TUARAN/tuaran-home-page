import {
  DIGITAL_HUMAN_REPLICATE_PROVIDER,
  DIGITAL_HUMAN_SELF_HOSTED_PROVIDER,
} from './config'
import {
  cancelReplicatePrediction,
  getReplicatePrediction,
  submitSadTalkerJob,
} from './replicate'
import {
  cancelSelfHostedSadTalkerJob,
  getSelfHostedSadTalkerJob,
  submitSelfHostedSadTalkerJob,
} from './selfHosted'

function unsupportedProvider(provider) {
  const error = new Error(`UNSUPPORTED_DIGITAL_HUMAN_PROVIDER: ${provider}`)
  error.code = 'UNSUPPORTED_PROVIDER'
  return error
}

export function digitalHumanWebhookKind(provider) {
  if (provider === DIGITAL_HUMAN_SELF_HOSTED_PROVIDER) return 'sadtalker'
  if (provider === DIGITAL_HUMAN_REPLICATE_PROVIDER) return 'replicate'
  throw unsupportedProvider(provider)
}

export async function submitDigitalHumanProviderJob(provider, input) {
  if (provider === DIGITAL_HUMAN_SELF_HOSTED_PROVIDER) {
    return submitSelfHostedSadTalkerJob(input)
  }
  if (provider === DIGITAL_HUMAN_REPLICATE_PROVIDER) {
    return submitSadTalkerJob(input)
  }
  throw unsupportedProvider(provider)
}

export async function getDigitalHumanProviderJob(provider, jobId) {
  if (provider === DIGITAL_HUMAN_SELF_HOSTED_PROVIDER) {
    return getSelfHostedSadTalkerJob(jobId)
  }
  if (provider === DIGITAL_HUMAN_REPLICATE_PROVIDER) {
    return getReplicatePrediction(jobId)
  }
  throw unsupportedProvider(provider)
}

export async function cancelDigitalHumanProviderJob(provider, jobId) {
  if (provider === DIGITAL_HUMAN_SELF_HOSTED_PROVIDER) {
    return cancelSelfHostedSadTalkerJob(jobId)
  }
  if (provider === DIGITAL_HUMAN_REPLICATE_PROVIDER) {
    return cancelReplicatePrediction(jobId)
  }
  throw unsupportedProvider(provider)
}
