import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { safeEqual } from '../../../../lib/ownerAuth'
import { pollRssUpdates } from '../../../../lib/rssUpdateNotifications'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-rss-updates-secret'

function configuredSecrets(env) {
  return [
    env.RSS_UPDATES_SECRET,
    env.WEEKLY_SUMMARY_SECRET,
    env.PUBLIC_OPINION_COLLECT_SECRET,
    process.env.RSS_UPDATES_SECRET,
    process.env.WEEKLY_SUMMARY_SECRET,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

async function authorized(request, env) {
  const supplied = request.headers.get(HEADER_SECRET) || ''
  const secrets = configuredSecrets(env)
  if (supplied && secrets.some((secret) => safeEqual(supplied, secret))) {
    return { ok: true, via: 'secret' }
  }
  const guard = await getOwnerOrReject(request)
  if (guard.ok) return { ok: true, via: 'owner' }
  if (!secrets.length && guard.response) return guard
  return {
    ok: false,
    response: secrets.length
      ? Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
      : Response.json(
          {
            ok: false,
            error: 'RSS_UPDATES_SECRET_NOT_CONFIGURED',
            detail: '请配置 RSS_UPDATES_SECRET（可回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET），或使用站长登录调用。',
          },
          { status: 503 },
        ),
  }
}

async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const auth = await authorized(request, env)
  if (!auth.ok) return auth.response
  if (!env.DB) return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })

  try {
    const result = await pollRssUpdates(env.DB)
    return Response.json({ ...result, via: auth.via })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'RSS_UPDATES_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export const GET = handle
export const POST = handle
