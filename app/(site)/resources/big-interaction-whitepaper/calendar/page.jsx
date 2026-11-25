import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getD1 } from '../../../../../lib/db/d1.js'
import { interactionAgentHandles } from '../../../../../lib/interaction/agentPool.js'
import { loadOwnActivityDaysForPool } from '../../../../../lib/interaction/dailyTop/ownActivity.js'
import { DAILY_TOP_METRIC_LABEL, DAILY_TOP_SUBJECT, shanghaiDateKey } from '../../../../../lib/interaction/dailyTop/model.js'
import { loadCombinedDailyTopDays } from '../../../../../lib/interaction/dailyTop/store.js'
import XPage from '../../../../(x)/x-workbench/XPage'
import InteractionCalendar from './InteractionCalendar'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function edgeBindings() {
  // next build / next dev 在 Node 里调用会抛错。线上 Edge 才有 CONTENT_FEED 和 D1。
  if (globalThis.process?.release?.name === 'node') return { bucket: null, db: null }
  const env = getOptionalRequestContext()?.env
  let db = null
  try {
    db = env?.DB || getD1()
  } catch {
    db = null
  }
  return { bucket: env?.CONTENT_FEED || null, db }
}

const path = '/calendar'
const canonicalUrl = 'https://x.2aran.com/calendar'
const title = '大互动日历'
const intro = '选一天，看前一自然日里互动最多的十个账号，以及本账号各项任务完成了几次。'
const description = '按 Asia/Shanghai 选择日期，查看前一自然日与他人的互动前十、本账号各任务完成次数。'
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonicalUrl,
  inLanguage: 'zh-CN',
  isPartOf: {
    '@type': 'WebPage',
    name: 'X大互动',
    url: 'https://x.2aran.com/',
  },
}

export const metadata = {
  title: { absolute: `${title}｜X大互动` },
  description,
  alternates: { canonical: path },
  openGraph: {
    type: 'website',
    title,
    description,
    url: canonicalUrl,
    locale: 'zh_CN',
  },
}

export default async function BigInteractionCalendarPage() {
  const today = shanghaiDateKey()
  const { bucket, db } = edgeBindings()
  const days = await loadCombinedDailyTopDays(bucket)
  let activities = []
  try {
    activities = await loadOwnActivityDaysForPool(db, { today })
  } catch {
    activities = []
  }
  return (
    <XPage active="/calendar" title={title} intro={intro} meta={<span>{DAILY_TOP_METRIC_LABEL}。任务次数只计本账号确认完成的动作。</span>}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <InteractionCalendar days={days} activities={activities} initialToday={today} />
    </XPage>
  )
}
