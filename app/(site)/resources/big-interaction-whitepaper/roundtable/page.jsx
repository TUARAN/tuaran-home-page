import Link from 'next/link'
import snapshot from '../../../../../lib/interaction/roundtableSummary.json'
import RoundtableHall from './RoundtableHall'
import styles from './roundtable.module.css'

export const dynamic = 'force-static'
const canonical = '/resources/big-interaction-whitepaper/roundtable'
const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '圆桌大会 · 大互动理论', url: `https://2aran.com${canonical}`, description: '认证粉丝名录的圆桌可视化展示' }
export const metadata = { alternates: { canonical: '/resources/big-interaction-whitepaper/roundtable' }, openGraph: { type: 'website', title: '圆桌大会 · 大互动理论', url: 'https://2aran.com/resources/big-interaction-whitepaper/roundtable' }, title: '圆桌大会 · 大互动理论', description: '从矿工阿三的 X 认证粉丝列表出发，围绕大互动理论认识交流伙伴。' }

export default function RoundtablePage() {
  const updated = new Date(snapshot.updatedAt || snapshot.capturedAt).toISOString().replace('T', ' ').slice(0, 16)
  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 大互动理论</Link>
    <header className={styles.header}>
      <p className={styles.eyebrow}>THE BIG INTERACTION ASSEMBLY</p>
      <h1>大互动理论，开会了。</h1>
      <p>一张圆桌，许多视角。会议主题：<strong>大互动理论</strong></p>
      <div className={styles.stats}><span>{snapshot.count.toLocaleString('en-US')} 位伙伴</span></div>
    </header>
    <RoundtableHall />
    <section className={styles.guestbook} aria-labelledby="guestbook-title">
      <div className={styles.guestbookHeading}><h2 id="guestbook-title">游客留言</h2><span>2 条示例留言</span></div>
      <p className={styles.guestbookIntro}>路过也可以聊两句。你最近一次主动找人聊天，聊得怎么样？</p>
      <ol className={styles.guestComments}>
        <li><article><header><strong>游客 · 小周</strong><time dateTime="2026-11-01T21:36:00+08:00">11 月 1 日 21:36</time></header><p>看完想起上周找老同事吃饭，本来想问问他换工作的事，结果聊了两个小时娃。工作没问成，饭倒是吃得挺开心。</p></article></li>
        <li><article><header><strong>游客 · 路过的阿木</strong><time dateTime="2026-10-31T12:18:00+08:00">10 月 31 日 12:18</time></header><p>主动开口这一步我还行，别人没回就容易多想。现在试着发完消息先去干别的，别一直盯着手机，确实舒服一点。</p></article></li>
      </ol>
    </section>
    <aside className={styles.note}><h2>认证粉丝名录</h2><p>采集更新：{updated} UTC。已收录本次采集结果；连续无新增后暂停，尚未确认名单完整。缺失或加载失败的头像使用昵称占位。</p><p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p></aside>
  </main>
}
