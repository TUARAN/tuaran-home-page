import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

export const DIGITAL_HUMAN_PROVIDER = 'replicate-sadtalker'
export const DIGITAL_HUMAN_TTS_MODEL = '@cf/myshell-ai/melotts'
export const DIGITAL_HUMAN_TTS_LANG = 'zh'
export const MAX_DIGITAL_HUMAN_SCRIPT_CHARS = 200
export const MAX_DIGITAL_HUMAN_IMAGE_BYTES = 5 * 1024 * 1024
export const DIGITAL_HUMAN_RESULT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
export const DIGITAL_HUMAN_INPUT_URL_TTL_MS = 60 * 60 * 1000
export const DIGITAL_HUMAN_WEBHOOK_TTL_MS = 24 * 60 * 60 * 1000

// Replicate 社区模型必须固定版本。环境变量可在不改代码的情况下升级模型版本。
export const DEFAULT_REPLICATE_SADTALKER_VERSION =
  '85c698db7c0a66d5011435d0191db323034e1da04b912a6d365833141b6a285b'

export const DIGITAL_HUMAN_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const DIGITAL_HUMAN_IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function getDigitalHumanEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

export function getReplicateApiToken() {
  const token = String(getDigitalHumanEnv().REPLICATE_API_TOKEN || '').trim()
  if (!token) throw new Error('REPLICATE_API_TOKEN is missing')
  return token
}

export function getDigitalHumanSigningSecret() {
  const env = getDigitalHumanEnv()
  const secret = String(env.DIGITAL_HUMAN_SIGNING_SECRET || env.REPLICATE_API_TOKEN || '').trim()
  if (!secret) throw new Error('DIGITAL_HUMAN_SIGNING_SECRET is missing')
  return secret
}

export function getReplicateSadTalkerVersion() {
  return String(
    getDigitalHumanEnv().REPLICATE_SADTALKER_VERSION ||
      DEFAULT_REPLICATE_SADTALKER_VERSION
  ).trim()
}

/** 默认仅站长可用；明确配置 authed 后才向所有登录用户开放。 */
export function getDigitalHumanAccessMode() {
  return String(getDigitalHumanEnv().DIGITAL_HUMAN_ACCESS || 'owner')
    .trim()
    .toLowerCase() === 'authed'
    ? 'authed'
    : 'owner'
}

export function sanitizeDigitalHumanUserId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 160) || 'user'
}

export function normalizeDigitalHumanScript(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim()
}
