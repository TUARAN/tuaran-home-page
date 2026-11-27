import XPage from '../../../../(x)/x-workbench/XPage'
import RoundtableGuestbook from './RoundtableGuestbook'
import RoundtableHall from './RoundtableHall'
import styles from './roundtable.module.css'

export const dynamic = 'force-static'
const path = '/roundtable'
const canonicalUrl = 'https://x.2aran.com/roundtable'
const title = '大互动圆桌'
const intro = '切换运营账号，从该账号的 X 认证粉丝名录入座。互动越多的伙伴越靠前桌次；默认矿工阿三（tarsixseveneig1）。'
const description = '按账号浏览认证粉丝圆桌，席位按大互动日历累计互动量排序；认识可以一起交流的伙伴。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: canonicalUrl, description, inLanguage: 'zh-CN', isPartOf: { '@type': 'WebSite', name: 'X大互动', url: 'https://x.2aran.com/' } }
export const metadata = { alternates: { canonical: path }, openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' }, title: { absolute: `${title}｜X大互动` }, description }

export default function RoundtablePage() {
  return (
    <XPage active="/roundtable" title={title} intro={intro} meta={<span>席位按大互动日历双向公开互动累计量排序；其他账号需先完成名录采集。</span>}>
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