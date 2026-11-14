import Link from 'next/link'
import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { DAILY_TOP_METRIC_LABEL, DAILY_TOP_SUBJECT, shanghaiDateKey } from '../../../../../lib/interaction/dailyTop/model.js'
import { loadCombinedDailyTopDays } from '../../../../../lib/interaction/dailyTop/store.js'
import ManualPaper from '../../../components/book-reader/ManualPaper'
import PageContainer from '../../../components/PageContainer'
import InteractionCalendar from './InteractionCalendar'
import styles from './calendar.module.css'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function contentFeed() {
  // next build / next dev 在 Node 里调用会抛错。线上 Edge 才有 CONTENT_FEED。
  if (globalThis.process?.release?.name === 'node') return null
  return getOptionalRequestContext()?.env?.CONTENT_FEED || null
}

const path = '/resources/big-interaction-whitepaper/calendar'
const canonicalUrl = 'https://2aran.com/resources/big-interaction-whitepaper/calendar'
const title = '大互动日历'
const description = '按 Asia/Shanghai 选择日期，查看当天双向公开互动前十。统计公开回复、提及与引用，不含私信。'
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `${title} · 绿皮书`,
  description,
  url: canonicalUrl,
  inLanguage: 'zh-CN',
  isPartOf: {
    '@type': 'WebPage',
    name: '大互动理论绿皮书',
    url: 'https://2aran.com/resources/big-interaction-whitepaper',
  },
}

export const metadata = {
  title: `${title} · 绿皮书`,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: 'website',
    title: `${title} · 绿皮书`,
    description,
    url: canonicalUrl,
    locale: 'zh_CN',
  },
}

export default async function BigInteractionCalendarPage() {
  const days = await loadCombinedDailyTopDays(contentFeed())
  return (
    <ManualPaper tone="green">
    <PageContainer width="standard" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 绿皮书</Link>
      <header className={styles.masthead}>
        <p className={styles.kicker}>绿皮书 · 每日前十</p>
        <h1>{title}</h1>
        <p className={styles.deck}>选择日期，查看该日与 @{DAILY_TOP_SUBJECT} 互动最多的十个账号。</p>
        <p className={styles.metric}>{DAILY_TOP_METRIC_LABEL}。统计已排除 @{DAILY_TOP_SUBJECT}。</p>
        <p className={styles.permalink}>公开地址 <a href={path}>{canonicalUrl}</a></p>
      </header>
      <InteractionCalendar days={days} initialToday={shanghaiDateKey()} />
    </PageContainer>
    </ManualPaper>
  )
}
