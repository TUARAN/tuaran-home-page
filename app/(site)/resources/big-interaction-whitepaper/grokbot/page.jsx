
import { loadGrokbotExecutions } from '../../../../../lib/interaction/grokbotExecutions/load.js'
import XPage from '../../../../(x)/x-workbench/XPage'
import GrokbotExecutionRecords from './GrokbotExecutionRecords'
import styles from '../calendar/calendar.module.css'

export const dynamic = 'force-static'

const path = '/grokbot'
const canonicalUrl = 'https://x.2aran.com/grokbot'
const title = 'GrokBot 秘籍'
const intro = '用 Grokbot 管理 X 关注列表：CZ 的公开用法，以及批次取关的规则、进度和核验结果。'
const description = '用 Grokbot 管理 X 账号：CZ 的使用记录，以及批次取关的规则、进度和已核验结果。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonicalUrl, inLanguage: 'zh-CN' }

export const metadata = {
  title: { absolute: `${title}｜X大互动` },
  description,
  alternates: { canonical: path },
  openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' },
}

export default function GrokbotPage() {
  const executions = loadGrokbotExecutions()
  return (
    <XPage active="/grokbot" title={title} intro={intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className={styles.executions} aria-labelledby="grokbot-cz-heading">
        <h2 id="grokbot-cz-heading">CZ 用 Grokbot 清理关注列表</h2>
        <p className={styles.execMeta}>
          <a href="https://x.com/cz_binance" target="_blank" rel="noopener noreferrer">@cz_binance</a> · 2026-11-23 10:56 AM · 截图时 1.3M 浏览、805 回复、507 转发、8.9K 喜欢、461 收藏
        </p>
        <blockquote className={styles.execNote}>
          Used Grok Bot to clean up inactive and abusive accounts I follow. Ask it to keep constructive criticism. Not sure how well it worked. &quot;AI did it.&quot;
        </blockquote>
        <p className={styles.execMeta}>
          做法：把清理条件直接写给 Grokbot，例如不活跃、辱骂类账号要取关，有建设性批评的要保留，再逐批核对取关结果。
        </p>
      </section>
      <GrokbotExecutionRecords records={executions} />
    </XPage>
  )
}
