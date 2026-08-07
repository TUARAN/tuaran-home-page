import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { INTEGRATION_SERVICES, INTEGRATION_WEBHOOKS } from '../../../../lib/integrationCatalog'
import {
  deleteIntegrationCredential,
  getIntegrationEnv,
  getIntegrationMasterSecret,
  listIntegrationCredentials,
  probeEnvStatus,
  upsertIntegrationCredential,
} from '../../../../lib/integrationKeys'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', message: '当前运行环境没有 D1 绑定。' }, { status: 503 })
  }

  try {
    const credentials = await listIntegrationCredentials(db)
    const env = getIntegrationEnv()
    const services = INTEGRATION_SERVICES.map((service) => ({
      ...service,
      credentialCount: credentials.filter((item) => item.service === service.id && item.status === 'active').length,
    }))
    const registeredServiceIds = new Set(credentials.map((item) => item.service))
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      services,
      webhooks: INTEGRATION_WEBHOOKS,
      credentials,
      envStatus: probeEnvStatus(env),
      masterSecretConfigured: Boolean(getIntegrationMasterSecret(env)),
      stats: {
        credentials: credentials.length,
        active: credentials.filter((item) => item.status === 'active').length,
        servicesCovered: registeredServiceIds.size,
      },
    })
  } catch (error) {
    return Response.json(
      { status: 'error', message: '集成台账读取失败。', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', message: '当前运行环境没有 D1 绑定。' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })

  try {
    const result = await upsertIntegrationCredential(db, {
      id: String(body.id || ''),
      name: String(body.name || ''),
      service: String(body.service || ''),
      kind: String(body.kind || 'secret'),
      envRef: String(body.envRef || ''),
      value: String(body.value || ''),
      baseUrl: String(body.baseUrl || ''),
      status: String(body.status || 'active'),
      note: String(body.note || ''),
      masterSecret: getIntegrationMasterSecret(getIntegrationEnv()),
    })
    if (!result.ok) {
      const detail = result.error === 'ENC_SECRET_MISSING' ? result.detail : undefined
      return Response.json(
        { error: result.error, ...(detail ? { detail } : {}) },
        { status: result.error === 'ENC_SECRET_MISSING' ? 503 : 400 },
      )
    }
    return Response.json({ ok: true, credential: result.credential }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: 'INTEGRATION_UPSERT_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', message: '当前运行环境没有 D1 绑定。' }, { status: 503 })
  }

  const id = String(new URL(req.url).searchParams.get('id') || '').trim()
  const result = await deleteIntegrationCredential(db, id)
  if (!result.ok) return Response.json({ error: result.error || 'NOT_FOUND' }, { status: 404 })
  return Response.json({ ok: true, id })
}
