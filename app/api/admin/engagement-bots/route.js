import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { hasUsableDeepSeekKey } from '../../../../lib/deepseekKeys'
import { DEFAULT_ENGAGEMENT_BOTS, DEFAULT_ENGAGEMENT_BOT_SETTINGS, ENGAGEMENT_BOT_SOURCE } from '../../../../lib/engagementBot'
import {
  createEngagementBot,
  deleteEngagementBot,
  getEngagementBotOverview,
  saveEngagementBotSettings,
  updateEngagementBot,
} from '../../../../lib/engagementBotRun'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function previewOverview(adminDeepSeekConfigured = false) {
  const now = Date.now()
  return {
    persistent: false,
    adminDeepSeekConfigured,
    settings: { ...DEFAULT_ENGAGEMENT_BOT_SETTINGS, contentPrefixes: [...DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes] },
    bots: DEFAULT_ENGAGEMENT_BOTS.map((bot, index) => ({
      id: index + 1,
      slug: bot.slug,
      displayName: bot.displayName,
      voicePrompt: bot.voicePrompt,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      userId: `reader:${bot.slug}`,
      voterKey: `user:reader:${bot.slug}`,
    })),
    actions: [],
    runs: [],
    stats: {
      bots: DEFAULT_ENGAGEMENT_BOTS.length,
      enabledBots: DEFAULT_ENGAGEMENT_BOTS.length,
      likesToday: 0,
      commentsToday: 0,
      failedToday: 0,
    },
  }
}

export async function GET(request) {
  const auth = await getOwnerOrReject(request)
  if (!auth.ok) return auth.response
  const env = getOptionalRequestContext()?.env || {}
  const adminDeepSeekConfigured = await hasUsableDeepSeekKey({
    env,
    source: ENGAGEMENT_BOT_SOURCE,
    taskType: 'comment',
  }).catch(() => false)
  const db = dbOrNull()
  if (!db) return Response.json(previewOverview(adminDeepSeekConfigured))
  try {
    const overview = await getEngagementBotOverview(db)
    return Response.json({ ...overview, adminDeepSeekConfigured })
  } catch (error) {
    if (String(error?.message || error).includes('no such table')) {
      return Response.json(previewOverview(adminDeepSeekConfigured))
    }
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await getOwnerOrReject(request)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  const result = await createEngagementBot(db, body)
  if (result.error) {
    const status = result.error === 'SLUG_TAKEN' ? 409 : 400
    return Response.json({ error: result.error }, { status })
  }
  return Response.json({ bot: result.bot }, { status: 201 })
}

export async function PATCH(request) {
  const auth = await getOwnerOrReject(request)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  if (body?.kind === 'settings') {
    const settings = await saveEngagementBotSettings(db, body.settings || body, auth.user?.id || 'owner')
    return Response.json({ settings })
  }
  const result = await updateEngagementBot(db, body)
  if (result.error) {
    const status = result.error === 'NOT_FOUND' ? 404 : 400
    return Response.json({ error: result.error }, { status })
  }
  return Response.json({ bot: result.bot })
}

export async function DELETE(request) {
  const auth = await getOwnerOrReject(request)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const id = new URL(request.url).searchParams.get('id')
  const result = await deleteEngagementBot(db, id)
  if (result.error) {
    const status = result.error === 'NOT_FOUND' ? 404 : 400
    return Response.json({ error: result.error }, { status })
  }
  return Response.json({ ok: true })
}
