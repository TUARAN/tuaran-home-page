import Link from 'next/link'
import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getD1 } from '../../../../../lib/db/d1.js'
import { loadOwnActivityDays } from '../../../../../lib/interaction/dailyTop/ownActivity.js'
import { DAILY_TOP_METRIC_LABEL, DAILY_TOP_SUBJECT, shanghaiDateKey } from '../../../../../lib/interaction/dailyTop/model.js'
import { loadCombinedDailyTopDays } from '../../../../../lib/interaction/dailyTop/store.js'
import { loadGrokbotExecutions } from '../../../../../lib/interaction/grokbotExecutions/load.js'
import XSiteFrame from '../../../../(x)/x-workbench/XSiteFrame'
import ManualPaper from '../../../components/book-reader/ManualPaper'
import PageContainer from '../../../components/PageContainer'
import InteractionCalendar from './InteractionCalendar'
import styles from './calendar.module.css'

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
const description = '按 Asia/Shanghai 选择日期，查看前一自然日与他人的互动前十、本账号各任务完成次数，以及 Grokbot 批次取关执行记录。'
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonicalUrl,
  inLanguage: 'zh-CN',
  isPartOf: {
    '@type': 'WebPage',
    name: '热榜',
    url: 'https://x.2aran.com/x-workbench#hot',
  },
}

export const metadata = {
  title,
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
  const executions = loadGrokbotExecutions()
  let activities = []
  try {
    activities = await loadOwnActivityDays(db, { today })
  } catch {
    activities = []
  }
  return (
    <XSiteFrame active="/x-workbench#hot">
    <ManualPaper tone="green">
    <PageContainer width="standard" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link className={styles.back} href="/x-workbench#hot">← 热榜</Link>
      <header className={styles.masthead}>
        <p className={styles.kicker}>往日记录</p>
        <h1>{title}</h1>
        <p className={styles.deck}>选择日期，查看前一天与 @{DAILY_TOP_SUBJECT} 互动最多的十个账号，以及本账号各任务完成了多少次。页内另有独立的 Grokbot 执行记录台账。</p>
        <p className={styles.metric}>{DAILY_TOP_METRIC_LABEL}。任务次数只计本账号确认完成的动作。</p>
        <p className={styles.permalink}>公开地址 <a href={path}>{canonicalUrl}</a></p>
      </header>
      <InteractionCalendar days={days} activities={activities} initialToday={today} executions={executions} />
    </PageContainer>
    </ManualPaper>
    </XSiteFrame>
  )
}
