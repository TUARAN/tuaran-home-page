const HTML_RESPONSE_RE = /<!doctype html|<html[\s>]|<body[\s>]/i

function compactText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeDigitalHumanProviderError({
  status = 0,
  detail = '',
} = {}) {
  const raw = compactText(detail)
  const statusCode = Number(status) || 0

  if (
    statusCode === 402 ||
    /insufficient credit|purchase credit|billing/i.test(raw)
  ) {
    return {
      code: 'PROVIDER_CREDIT_REQUIRED',
      detail: 'Replicate 余额不足，请充值后重试，或切换到自建 SadTalker。',
    }
  }

  if (statusCode === 401 || statusCode === 403) {
    return {
      code: 'PROVIDER_AUTH_FAILED',
      detail: '数字人生成服务鉴权失败，请检查 API Token。',
    }
  }

  if (statusCode === 404) {
    return {
      code: 'PROVIDER_MODEL_UNAVAILABLE',
      detail: '当前数字人模型暂不可用，请稍后重试或更新模型版本。',
    }
  }

  if (statusCode === 429) {
    return {
      code: 'PROVIDER_RATE_LIMITED',
      detail: '数字人生成服务当前请求较多，请稍后再试。',
    }
  }

  if (statusCode >= 500) {
    return {
      code: 'PROVIDER_TEMPORARILY_UNAVAILABLE',
      detail: '数字人生成服务暂时不可用，请稍后再试。',
    }
  }

  if (!raw || HTML_RESPONSE_RE.test(raw)) {
    return {
      code: 'PROVIDER_INVALID_RESPONSE',
      detail: '数字人生成服务返回异常，请稍后再试。',
    }
  }

  return {
    code: 'PROVIDER_FAILED',
    detail: raw.slice(0, 240),
  }
}

export function digitalHumanErrorMessage(errorCode, errorDetail = '') {
  const code = String(errorCode || '')
  const detail = compactText(errorDetail)

  if (
    code === 'PROVIDER_CREDIT_REQUIRED' ||
    /REPLICATE_402|insufficient credit|purchase credit/i.test(detail)
  ) {
    return 'Replicate 余额不足，请充值后重试，或切换到自建 SadTalker。'
  }
  if (code === 'PROVIDER_AUTH_FAILED') {
    return '数字人生成服务鉴权失败，请联系站长处理。'
  }
  if (code === 'PROVIDER_MODEL_UNAVAILABLE') {
    return '当前数字人模型暂不可用，请稍后再试。'
  }
  if (code === 'PROVIDER_RATE_LIMITED') {
    return '当前生成请求较多，请稍后再试。'
  }
  if (
    code.startsWith('PROVIDER_') ||
    code === 'GENERATION_SETUP_FAILED' ||
    HTML_RESPONSE_RE.test(detail)
  ) {
    return '数字人口播生成失败，请稍后再试。'
  }
  if (code === 'TTS_FAILED') {
    return '中文语音生成失败，请稍后再试。'
  }
  return detail.slice(0, 240) || '数字人口播生成失败，请稍后再试。'
}
