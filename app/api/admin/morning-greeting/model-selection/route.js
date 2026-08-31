import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { listOllamaModels } from '../../../../../lib/ollama'
import {
  buildModelSelectionOptions,
  modelSelectionId,
  parseModelSelection,
} from '../../../../../lib/modelSelection'
import { DAILY_GREETING_MODEL_SELECTIONS_KEY } from '../../../../../lib/dailyGreetingLlm'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function readSetting(db, key) {
  const { results } = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).all()
  return results?.[0]?.value ?? null
}

async function writeSetting(db, key, value, updatedBy) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(key, value, Date.now(), String(updatedBy || 'admin')).run()
}

async function loadCatalog(db) {
  const { results } = await db.prepare(
    `SELECT id, name, default_model
     FROM llm_providers
     WHERE provider_type = 'ollama' AND status = 'active'
     ORDER BY updated_at DESC`,
  ).all()
  const providers = await Promise.all((results || []).map(async (row) => {
    try {
      const discovered = await listOllamaModels(row.id)
      return { id: row.id, name: row.name, defaultModel: row.default_model, models: discovered.models, modelListError: '' }
    } catch (error) {
      return { id: row.id, name: row.name, defaultModel: row.default_model, models: [], modelListError: String(error?.message || error) }
    }
  }))
  return { providers, options: buildModelSelectionOptions({ providers }) }
}

function normalizeSelectedId(raw, options, providers) {
  let selected = String(raw || '').trim()
  if (selected.startsWith('[')) {
    try { selected = String(JSON.parse(selected)?.[0] || '') } catch { selected = '' }
  }
  const target = parseModelSelection(selected)
  if (target?.provider === 'ollama' && !target.model) {
    const provider = providers.find((item) => item.id === target.providerId)
    selected = modelSelectionId({ provider: 'ollama', providerId: target.providerId, model: provider?.defaultModel })
  }
  return options.some((option) => option.id === selected) ? selected : 'deepseek'
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getD1()
  const [savedRaw, catalog] = await Promise.all([
    readSetting(db, DAILY_GREETING_MODEL_SELECTIONS_KEY),
    loadCatalog(db),
  ])
  return Response.json({
    ok: true,
    selectedModelId: normalizeSelectedId(savedRaw, catalog.options, catalog.providers),
    ...catalog,
  })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getD1()
  const body = await req.json().catch(() => null)
  const modelId = String(body?.modelId || '').trim()
  const catalog = await loadCatalog(db)
  if (!catalog.options.some((option) => option.id === modelId)) {
    return Response.json({ error: 'MODEL_NOT_AVAILABLE' }, { status: 400 })
  }
  await writeSetting(db, DAILY_GREETING_MODEL_SELECTIONS_KEY, JSON.stringify([modelId]), guard.user?.name)
  return Response.json({ ok: true, selectedModelId: modelId })
}
