import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  FRONTEND_WEEKLY_KEYS,
  dailyObjectKey,
  mergeDailyManifest,
  readR2Json,
  sanitizeDailyPayload,
  sanitizeLivePayload,
  sanitizeWeeklyPayload,
  writeR2Json,
} from '../../../../lib/frontendWeeklyData'
import { verifyGitHubActionsToken } from '../../../../lib/githubActionsOidc'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const AUDIENCE = 'https://2aran.com/api/frontend-weekly/ingest'
const REPOSITORY = 'TUARAN/frontend-weekly-digest-cn'
const REF = 'refs/heads/main'

function bearerToken(request) {
  const header = request.headers.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}
export async function POST(request) {
  const bucket = getOptionalRequestContext()?.env?.CONTENT_FEED
  if (!bucket) return Response.json({ error: 'CONTENT_FEED_UNAVAILABLE' }, { status: 503 })

  try {
    await verifyGitHubActionsToken(bearerToken(request), {
      audience: AUDIENCE,
      repository: REPOSITORY,
      ref: REF,
    })
  } catch (error) {
    return Response.json({ error: 'UNAUTHORIZED', detail: error.message }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  try {
    if (body?.type === 'live') {
      const live = sanitizeLivePayload(body.data)
      await writeR2Json(bucket, FRONTEND_WEEKLY_KEYS.live, live, 'public, max-age=300')
      return Response.json({ ok: true, type: 'live', count: live.items.length })
    }

    if (body?.type === 'daily') {
      const daily = sanitizeDailyPayload(body.data)
      const current = await readR2Json(bucket, FRONTEND_WEEKLY_KEYS.dailyIndex, { latest: '', list: [] })
      const manifest = mergeDailyManifest(current, daily)
      await Promise.all([
        writeR2Json(bucket, dailyObjectKey(daily.date), daily, 'public, max-age=31536000, immutable'),
        writeR2Json(bucket, FRONTEND_WEEKLY_KEYS.dailyIndex, manifest, 'public, max-age=3600'),
      ])
      return Response.json({ ok: true, type: 'daily', date: daily.date, count: daily.items.length })
    }

    if (body?.type === 'weekly') {
      const weekly = sanitizeWeeklyPayload(body.data)
      await writeR2Json(bucket, FRONTEND_WEEKLY_KEYS.weeklyIndex, weekly, 'public, max-age=21600')
      return Response.json({ ok: true, type: 'weekly', count: weekly.issues.length })
    }

    return Response.json({ error: 'UNSUPPORTED_TYPE' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: 'INVALID_PAYLOAD', detail: error.message }, { status: 400 })
  }
}
