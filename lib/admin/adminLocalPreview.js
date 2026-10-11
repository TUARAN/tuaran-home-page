import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on'])

function getEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

function envFlag(value) {
  return ENABLED_VALUES.has(String(value || '').trim().toLowerCase())
}

export function isAdminLocalPreviewEnabled() {
  const env = getEnv()
  const isDev = process.env.NODE_ENV === 'development' || env.NODE_ENV === 'development'
  return isDev && envFlag(env.ADMIN_LOCAL_PREVIEW || process.env.ADMIN_LOCAL_PREVIEW)
}

export function getAdminLocalPreviewUser() {
  return {
    id: 'local-admin-preview',
    login: 'local-admin',
    name: 'Local Admin Preview',
    email: 'local-admin@localhost',
    provider: 'local-preview',
    localPreview: true,
  }
}
