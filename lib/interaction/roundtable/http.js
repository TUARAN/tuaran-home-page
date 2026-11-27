import { resolveDailyTopAccount } from '../dailyTop/http.js'
import { loadCombinedDailyTopDays } from '../dailyTop/store.js'
import { findInteractionAgent } from '../agentPool.js'
import { aggregateInteractionCounts, sortRoundtablePeople } from './rank.js'
import { readRoundtableSnapshot } from './store.js'

export function roundtableEmptyMessage(subject) {
  const agent = findInteractionAgent(subject)
  const label = agent?.name ? `${agent.name}（@${agent.handle}）` : `@${subject}`
  return `${label} 还没有圆桌名录快照。请先在 X 认证粉丝页完成采集并上传，或改选已有数据的账号。`
}

export function toPublicRoundtablePayload(snapshot, people) {
  return {
    subject: snapshot.owner,
    owner: snapshot.owner,
    capturedAt: snapshot.capturedAt,
    complete: snapshot.complete,
    source: snapshot.source,
    sourceType: snapshot.sourceType,
    updatedAt: snapshot.updatedAt,
    count: snapshot.count,
    avatarCount: snapshot.avatarCount,
    people,
    sort: 'interaction_total_from_daily_top',
  }
}

export async function handleRoundtableGet(request, bindings = {}) {
  const url = new URL(request.url)
  const subject = resolveDailyTopAccount(url.searchParams.get('account'))
  if (!subject) {
    return Response.json({ error: 'INVALID_ACCOUNT' }, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const media = bindings.media
  if (!media) {
    return Response.json({ error: 'ROUNDTABLE_UNAVAILABLE' }, { status: 503 })
  }

  const snapshot = await readRoundtableSnapshot(media, subject)
  if (!snapshot) {
    return Response.json({
      error: 'NOT_FOUND',
      subject,
      message: roundtableEmptyMessage(subject),
    }, {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const dailyTopDays = await loadCombinedDailyTopDays(bindings.contentFeed || null)
  const totals = aggregateInteractionCounts(dailyTopDays, subject)
  const people = sortRoundtablePeople(snapshot.people, totals)

  return Response.json(toPublicRoundtablePayload(snapshot, people), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}