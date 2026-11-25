import XPage from '../../../../(x)/x-workbench/XPage'
import snapshot from '../../../../../lib/interaction/roundtableSummary.json'
import RoundtableGuestbook from './RoundtableGuestbook'
import RoundtableHall from './RoundtableHall'
import styles from './roundtable.module.css'

export const dynamic = 'force-static'
const path = '/roundtable'
const canonicalUrl = 'https://x.2aran.com/roundtable'
const title = '大互动圆桌'
const intro = '从矿工阿三的 X 认证粉丝列表出发，认识可以一起交流的伙伴。'
const description = '从矿工阿三的 X 认证粉丝列表出发，围绕大互动理论认识交流伙伴。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: canonicalUrl, description, inLanguage: 'zh-CN', isPartOf: { '@type': 'WebSite', name: 'X大互动', url: 'https://x.2aran.com/' } }
export const metadata = { alternates: { canonical: path }, openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' }, title: { absolute: `${title}｜X大互动` }, description }

export default function RoundtablePage() {
  const updated = new Date(snapshot.updatedAt || snapshot.capturedAt).toISOString().replace('T', ' ').slice(0, 16)
  return (
    <XPage active="/roundtable" title={title} intro={intro} meta={<><span>{snapshot.count.toLocaleString('en-US')} 位伙伴</span><span>采集更新 {updated} UTC</span></>}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <RoundtableHall />
      <RoundtableGuestbook />
      <aside className={styles.note}>
        <h2>认证粉丝名录</h2>
        <p>已收录本次采集结果；连续无新增后暂停，尚未确认名单完整。缺失或加载失败的头像使用昵称占位。</p>
        <p>圆桌是认证粉丝关系的可视化展示。所列账号不代表实际参会、发言或认可会议主题。点击头像可查看其 X 主页。</p>
      </aside>
    </XPage>
  )
}