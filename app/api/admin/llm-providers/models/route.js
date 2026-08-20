import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { listOllamaModels } from '../../../../../lib/ollama'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const providerId = String(new URL(req.url).searchParams.get('id') || '').trim()
  if (!providerId) return Response.json({ error: 'MISSING_ID', detail: '缺少 Ollama 服务 ID' }, { status: 400 })

  try {
    const result = await listOllamaModels(providerId)
    return Response.json({ ok: true, providerId: result.providerId, models: result.models })
  } catch (error) {
    const status = error?.code === 'OLLAMA_PROVIDER_NOT_FOUND' ? 404 : error?.status || 502
    return Response.json({
      error: error?.code || 'OLLAMA_MODELS_FAILED',
      detail: String(error?.message || error).slice(0, 500),
    }, { status })
  }
}
