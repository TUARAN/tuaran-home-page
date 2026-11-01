import Link from 'next/link'
import snapshot from '@/lib/interaction/roundtable.json'
import styles from './roundtable.module.css'

export const metadata = { title: '圆桌大会 · 大互动理论', description: '从矿工阿三的 X 认证粉丝列表出发，围绕大互动理论认识交流伙伴。' }

export default function RoundtablePage() {
  const tables = Array.from({ length: Math.max(1, Math.ceil(snapshot.people.length / 8)) }, (_, index) => snapshot.people.slice(index * 8, index * 8 + 8))
  return <main className={styles.page}>
    <Link className={styles.back} href="/resources/big-interaction-whitepaper">← 大互动理论</Link>
    <header className={styles.header}><p className={styles.eyebrow}>THE BIG INTERACTION ASSEMBLY</p><h1>把世界，请到圆桌旁。</h1><p>一张圆桌，许多视角。会议主题：<strong>大互动理论</strong></p><div className={styles.stats}><span>{snapshot.people.length} 位已收录认证粉丝</span><a href={snapshot.source} target="_blank" rel="noopener noreferrer">@{snapshot.owner} 的 X 认证粉丝列表 ↗</a></div></header>
    <div className={styles.hall}>{tables.map((people, index) => <section key={index} className={styles.scene} aria-label={`第 ${index + 1} 桌`}>
      <div className={styles.table}><span>圆桌 {String(index + 1).padStart(2, '0')}</span><h2>大互动理论</h2><p>表达 · 倾听 · 反馈 · 行动</p><i aria-hidden="true">✳</i></div>
      {Array.from({ length: 8 }, (_, seat) => { const person = people[seat]; const angle = seat * Math.PI / 4 - Math.PI / 2; const position = { left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 40}%` }; return person ? <a key={seat} className={styles.seat} style={position} href={`https://x.com/${person.handle}`} target="_blank" rel="noopener noreferrer">{person.avatar ? <img src={person.avatar} alt={`${person.name}的头像`} width="64" height="64" loading="lazy" referrerPolicy="no-referrer" /> : <span className={styles.avatarFallback} aria-label="原头像待补齐">{person.name.slice(0, 2).toUpperCase()}</span>}<strong>{person.name}</strong><small>@{person.handle}</small></a> : <div key={seat} className={`${styles.seat} ${styles.empty}`} style={position}><span aria-hidden="true">＋</span><small>待收录</small></div> })}
    </section>)}</div>
    <aside className={styles.note}><h2>{snapshot.capturedAt ? '认证粉丝名录' : '认证粉丝名录等待同步'}</h2><p>{snapshot.capturedAt ? `采集时间：${snapshot.capturedAt}。${snapshot.complete ? '已读取完整列表。' : '当前为部分记录，尚未读到列表末尾；原头像待补齐，暂用账号首字母显示。'}` : '尚未取得可核对的关注名单，头像席位将在读取真实账号信息后补齐。'}</p><p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p></aside>
  </main>
}
