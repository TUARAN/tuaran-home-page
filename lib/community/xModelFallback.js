export const X_MODEL_FALLBACK_MAX_CALLS_PER_HOUR = 60

export function normalizeXModelFallbackRequest(body) {
  if (!body || body.kind !== 'reply' || !Array.isArray(body.messages) || body.messages.length !== 2) return null
  const [system, user] = body.messages
  if (system?.role !== 'system' || user?.role !== 'user') return null
  const systemText = String(system.content || '').trim()
  const userText = String(user.content || '').trim()
  if (!systemText || !userText || systemText.length > 3500 || userText.length > 3000) return null
  return {
    messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }],
    accountHandle: String(body.accountHandle || '').replace(/^@/u, '').replace(/[^A-Za-z0-9_]/gu, '').slice(0, 15),
  }
}
