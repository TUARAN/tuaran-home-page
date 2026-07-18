import ContentEngagement from '../../components/ContentEngagement'
import WisdomFrontierClient from './WisdomFrontierClient'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'wisdom-frontier'

export const metadata = {
  title: '智慧边界｜全球顶级奖项与人类成就图谱',
  description: '覆盖自然科学、数学、计算机、工程、医学、设计、人文、艺术等 15 个领域的 33 项全球顶级奖项，认识代表人物、关键成就与持续学习路径。',
  keywords: ['智慧边界', '全球顶级奖项', '诺贝尔奖', '图灵奖', '菲尔兹奖', '普利兹克奖', '科学家', '人类成就', '学习地图'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: {
    type: 'website',
    title: '智慧边界｜全球顶级奖项与人类成就图谱',
    description: '从 15 个领域、33 项全球顶级奖项出发，追踪那些拓展人类智慧边界的人与成就。',
    url: `https://2aran.com/resources/${RESOURCE_SLUG}`,
  },
}

export default function WisdomFrontierPage() {
  return (
    <>
      <WisdomFrontierClient />
      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
