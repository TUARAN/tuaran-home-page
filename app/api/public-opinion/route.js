import { NextResponse } from 'next/server'

import {
  OPINION_POSTS,
  OPINION_TOPICS,
  PUBLIC_OPINION_STACK,
  SOURCE_CONNECTORS,
  TREND_POINTS,
  buildPublicOpinionSnapshot,
} from '../../../lib/publicOpinionData'

export const dynamic = 'force-dynamic'

function filterPosts(searchParams) {
  const topicId = searchParams.get('topicId') || 'all'
  const sourceId = searchParams.get('sourceId') || 'all'

  return OPINION_POSTS.filter((post) => {
    if (topicId !== 'all' && post.topicId !== topicId) return false
    if (sourceId !== 'all' && post.sourceId !== sourceId) return false
    return true
  })
}

export function GET(request) {
  const posts = filterPosts(new URL(request.url).searchParams)

  return NextResponse.json({
    generatedAt: new Date('2026-06-15T00:00:00.000Z').toISOString(),
    scope: 'public-content-demo',
    compliance:
      'Only public, non-login content should be collected. Respect robots.txt, rate limits, source attribution, and platform terms.',
    snapshot: buildPublicOpinionSnapshot(posts),
    topics: OPINION_TOPICS,
    posts,
    connectors: SOURCE_CONNECTORS,
    stack: PUBLIC_OPINION_STACK,
    trendPoints: TREND_POINTS,
  })
}
