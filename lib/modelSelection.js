export function parseModelSelection(value) {
  const id = String(value || '').trim()
  if (id === 'deepseek') return { id, provider: 'deepseek', providerId: '', model: 'deepseek-v4-flash' }
  if (id.startsWith('ollama:') && id.length > 7) {
    try {
      const raw = id.slice(7)
      const separator = raw.indexOf(':')
      const providerId = decodeURIComponent(separator === -1 ? raw : raw.slice(0, separator))
      const model = separator === -1 ? '' : decodeURIComponent(raw.slice(separator + 1))
      if (providerId) return { id, provider: 'ollama', providerId, model }
    } catch {
      return null
    }
  }
  return null
}

export function modelSelectionId({ provider, providerId = '', model = '' } = {}) {
  if (provider === 'deepseek') return 'deepseek'
  const serviceId = String(providerId || '').trim()
  const modelName = String(model || '').trim()
  if (provider !== 'ollama' || !serviceId) return ''
  return `ollama:${encodeURIComponent(serviceId)}${modelName ? `:${encodeURIComponent(modelName)}` : ''}`
}

export function buildModelSelectionOptions({ includeDeepSeek = true, providers = [] } = {}) {
  return [
    ...(includeDeepSeek ? [{ id: 'deepseek', provider: 'deepseek', providerId: '', model: 'deepseek-v4-flash', label: 'DeepSeek', hint: 'deepseek-v4-flash · 线上 API' }] : []),
    ...providers.flatMap((provider) => {
      const discovered = Array.isArray(provider.models) ? provider.models : []
      const models = discovered.some((model) => model.name === provider.defaultModel)
        ? discovered
        : [{ name: provider.defaultModel, displayName: provider.defaultModel }, ...discovered].filter((model) => model.name)
      return models.map((model) => ({
        id: modelSelectionId({ provider: 'ollama', providerId: provider.id, model: model.name }),
        provider: 'ollama',
        providerId: provider.id,
        model: model.name,
        label: model.displayName || model.name,
        hint: `${model.name} · ${provider.name}${/ollama/i.test(provider.name) ? '' : ' · Ollama'}`,
      }))
    }),
  ]
}
