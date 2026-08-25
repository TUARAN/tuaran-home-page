import RankBoard from './RankBoard'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://rank.2aran.com'),
  title: { absolute: '从夯到拉 · AI 排行榜' },
  description: '一份可以自己拖、自己改的 AI 产品分级榜。排名基于个人使用体验，持续更新。',
  alternates: { canonical: '/' },
  openGraph: {
    title: '从夯到拉 · AI 排行榜',
    description: '主流 AI 产品到底谁夯谁拉？打开榜单，拖出你的版本。',
    url: 'https://rank.2aran.com/',
    siteName: '从夯到拉',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '从夯到拉 · AI 排行榜',
    description: '主流 AI 产品到底谁夯谁拉？打开榜单，拖出你的版本。',
    images: [],
  },
}

export default function RankPage() {
  return <RankBoard />
}
