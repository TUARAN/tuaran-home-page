import XPage from '../../../../(x)/x-workbench/XPage'
import styles from './grokbot.module.css'

export const dynamic = 'force-static'

const path = '/grokbot'
const canonicalUrl = 'https://x.2aran.com/grokbot'
const title = 'Grokbot 秘籍'
const intro = '用 Grokbot 清理 X 关注列表：先写清规则和保留条件，看过名单再动手。'
const description = '用 Grokbot 清理 X 关注列表的策略、使用方法和预期效果，附 CZ 与马斯克的公开背书。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonicalUrl, inLanguage: 'zh-CN' }

const endorsements = [
  {
    who: 'CZ（@cz_binance）原帖',
    text: 'Used Grok Bot to clean up inactive and abusive accounts I follow. Ask it to keep constructive criticism. Not sure how well it worked. "AI did it." 🤷‍♂️ 🤣',
    href: 'https://x.com/cz_binance/status/2124698685116383430',
  },
  {
    who: '马斯克（@elonmusk）在该帖下回复',
    text: 'Cool',
    href: 'https://x.com/elonmusk/status/2124733560947138910',
  },
  {
    who: 'CZ 随后回复马斯克',
    text: 'Worked well so far.',
    href: 'https://x.com/cz_binance/status/2124744559343317455',
  },
]

const sections = [
  {
    id: 'strategy',
    heading: '策略',
    body: '把清理关注列表的规则直接写给 Grokbot。例如：未回关、长期不活跃、辱骂类账号要取关；有建设性批评的要保留。先把保留条件说清楚，再开始筛选。名单先给站长看，确认后再处理；未经确认不要扩大范围。',
  },
  {
    id: 'usage',
    heading: '使用方法',
    body: '向 Grokbot 说明你的规则和保留条件，让它按规则筛出候选并说明理由。你先核对、划掉要留下的人，再让它按你的确认去清理。需要对外发帖时只做预填，确认前不代发。',
  },
  {
    id: 'effect',
    heading: '预期效果',
    body: '关注列表更干净：该清理的未回关、不活跃或辱骂账号被处理掉，建设性批评和你要保留的人还在。过程是先看名单再动手，结果可以核对。CZ 已公开用过这套做法，并说目前效果不错；马斯克在原帖下回复「Cool」。',
  },
]

export const metadata = {
  title: { absolute: `${title}｜X大互动` },
  description,
  alternates: { canonical: path },
  openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' },
}

export default function GrokbotPage() {
  return (
    <XPage active="/grokbot" title={title} intro={intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {sections.map((section) => (
        <section key={section.id} className={styles.section} aria-labelledby={`grokbot-${section.id}`}>
          <h2 id={`grokbot-${section.id}`}>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <section className={styles.section} aria-labelledby="grokbot-endorsements">
        <h2 id="grokbot-endorsements">公开背书</h2>
        <ul className={styles.quotes}>
          {endorsements.map((item) => (
            <li key={item.href} className={styles.quote}>
              <blockquote cite={item.href}>{item.text}</blockquote>
              <p className={styles.quoteMeta}>
                {item.who} · <a href={item.href} target="_blank" rel="noopener noreferrer">查看原帖</a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </XPage>
  )
}
