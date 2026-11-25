import Link from 'next/link'
import XSiteFrame from '../../../../(x)/x-workbench/XSiteFrame'
import ManualPaper from '../../../components/book-reader/ManualPaper'
import PageContainer from '../../../components/PageContainer'
import snapshot from '../../../../../lib/interaction/roundtableSummary.json'
import RoundtableGuestbook from './RoundtableGuestbook'
import RoundtableHall from './RoundtableHall'
import styles from './roundtable.module.css'

export const dynamic = 'force-static'
const path = '/roundtable'
const canonicalUrl = 'https://x.2aran.com/roundtable'
const title = '大互动圆桌'
const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '大互动圆桌 · 大互动理论', url: canonicalUrl, description: '认证粉丝名录的圆桌可视化展示' }
export const metadata = { alternates: { canonical: path }, openGraph: { type: 'website', title: '大互动圆桌 · 大互动理论', url: canonicalUrl }, title: '大互动圆桌 · 大互动理论', description: '从矿工阿三的 X 认证粉丝列表出发，围绕大互动理论认识交流伙伴。' }

export default function RoundtablePage() {
  const updated = new Date(snapshot.updatedAt || snapshot.capturedAt).toISOString().replace('T', ' ').slice(0, 16)
  return (
    <XSiteFrame active="/theory">
      <ManualPaper tone="green">
        <PageContainer width="standard" className={styles.page}>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
          <Link className={styles.back} href="/theory">← 大互动理论</Link>
          <header className={styles.masthead}>
            <h1>{title}</h1>
            <p className={styles.metric}>{snapshot.count.toLocaleString('en-US')} 位伙伴 · 采集更新 {updated} UTC</p>
          </header>
          <RoundtableHall />
          <RoundtableGuestbook />
          <aside className={styles.note}>
            <h2>认证粉丝名录</h2>
            <p>已收录本次采集结果；连续无新增后暂停，尚未确认名单完整。缺失或加载失败的头像使用昵称占位。</p>
            <p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p>
          </aside>
        </PageContainer>
      </ManualPaper>
    </XSiteFrame>
  )
}