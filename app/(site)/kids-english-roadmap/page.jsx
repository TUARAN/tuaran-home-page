import KidsEnglishRoadmapClient from './KidsEnglishRoadmapClient'

const SITE_URL = 'https://2aran.com'
const PAGE_URL = `${SITE_URL}/kids-english-roadmap`

export const metadata = {
  title: '2–5 岁幼儿英语分层学习路线',
  description:
    '从 1 岁 9 个月起步的幼儿英语家庭方案：年龄分层、每日练习、动画片单、方法论与可信来源。',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: '2–5 岁幼儿英语分层学习路线',
    description: '按年龄和孩子的回应调整输入，把英语放进游戏、绘本与日常生活。',
    url: PAGE_URL,
    type: 'article',
  },
}

export default function KidsEnglishRoadmapPage() {
  return <KidsEnglishRoadmapClient />
}
