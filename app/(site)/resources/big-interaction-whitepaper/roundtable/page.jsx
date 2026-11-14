import Link from 'next/link'
import snapshot from '../../../../../lib/interaction/roundtableSummary.json'
import RoundtableGuestbook from './RoundtableGuestbook'
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
    <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 绿皮书</Link>
    <header className={styles.header}>
      <p className={styles.eyebrow}>绿皮书 · 圆桌大会</p>
      <h1>大互动理论，开会了。</h1>
      <p>一张圆桌，许多视角。会议主题：<strong>大互动理论</strong></p>
      <div className={styles.stats}><span>{snapshot.count.toLocaleString('en-US')} 位伙伴</span></div>
    </header>
    <RoundtableHall />
    <RoundtableGuestbook />
    <aside className={styles.note}><h2>认证粉丝名录</h2><p>采集更新：{updated} UTC。已收录本次采集结果；连续无新增后暂停，尚未确认名单完整。缺失或加载失败的头像使用昵称占位。</p><p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p></aside>
  </main>
}
