import Link from 'next/link'
import snapshot from '@/lib/interaction/roundtable.json'
import RoundtableHall from './RoundtableHall'
import styles from './roundtable.module.css'

export const metadata = { title: '圆桌大会 · 大互动理论', description: '从矿工阿三的 X 认证粉丝列表出发，围绕大互动理论认识交流伙伴。' }

export default function RoundtablePage() {
  const avatars = snapshot.people.filter(person => person.avatar).length
  const updated = new Date(snapshot.updatedAt || snapshot.capturedAt).toISOString().replace('T', ' ').slice(0, 16)
  return <main className={styles.page}>
    <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 大互动理论</Link>
    <header className={styles.header}>
      <p className={styles.eyebrow}>THE BIG INTERACTION ASSEMBLY</p>
      <h1>大互动理论，开会了。</h1>
      <p>一张圆桌，许多视角。会议主题：<strong>大互动理论</strong></p>
      <div className={styles.stats}><span>{snapshot.people.length.toLocaleString('en-US')} 位伙伴 · {avatars.toLocaleString('en-US')} 个原头像</span><a href={snapshot.source} target="_blank" rel="noopener noreferrer">@{snapshot.owner} 的 X 认证粉丝列表 ↗</a></div>
    </header>
    <RoundtableHall people={snapshot.people} />
    <aside className={styles.note}><h2>认证粉丝名录</h2><p>采集更新：{updated} UTC。已收录本次采集结果；连续无新增后暂停，尚未确认名单完整。缺失或加载失败的头像使用昵称占位。</p><p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p></aside>
  </main>
}
