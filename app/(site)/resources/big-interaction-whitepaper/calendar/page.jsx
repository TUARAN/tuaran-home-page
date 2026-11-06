import Link from 'next/link'

import { DAILY_TOP_METRIC_LABEL, DAILY_TOP_SUBJECT, shanghaiDateKey } from '../../../../../lib/interaction/dailyTop/model.js'
import { loadDailyTopDays } from '../../../../../lib/interaction/dailyTop/load.js'
import PageContainer from '../../../components/PageContainer'
import InteractionCalendar from './InteractionCalendar'
import styles from './calendar.module.css'

export const dynamic = 'force-static'

const path = '/resources/big-interaction-whitepaper/calendar'
const title = '大互动日历'
const description = '按 Asia/Shanghai 选择日期，查看当天双向公开互动前十。统计公开回复、提及与引用，不含私信。'
const days = loadDailyTopDays()
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `${title} · 大互动理论`,
  description,
  url: `https://2aran.com${path}`,
  inLanguage: 'zh-CN',
  isPartOf: {
    '@type': 'WebPage',
    name: '大互动理论',
    url: 'https://2aran.com/resources/big-interaction-whitepaper',
  },
}

export const metadata = {
  title: `${title} · 大互动理论`,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: 'website',
    title: `${title} · 大互动理论`,
    description,
    url: `https://2aran.com${path}`,
    locale: 'zh_CN',
  },
}

export default function BigInteractionCalendarPage() {
  return (
    <PageContainer width="standard" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 大互动理论</Link>
      <header className={styles.masthead}>
        <p className={styles.kicker}>BIG INTERACTION · 每日前十</p>
        <h1>{title}</h1>
        <p className={styles.deck}>选择日期，查看该日与 @{DAILY_TOP_SUBJECT} 互动最多的十个账号。</p>
        <p className={styles.metric}>{DAILY_TOP_METRIC_LABEL}。统计已排除 @{DAILY_TOP_SUBJECT}。</p>
      </header>
      <InteractionCalendar days={days} initialToday={shanghaiDateKey()} />
    </PageContainer>
  )
}
