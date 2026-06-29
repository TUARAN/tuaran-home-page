import { notFound } from 'next/navigation'
import PageContainer from '../../components/PageContainer'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import FeedClient from '../FeedClient'
import { getAllFeedItems, getFeedTypesPresent } from '../data'

export const dynamic = 'force-static'

/** 静态预生成所有已知 feed item 的路径 */
export function generateStaticParams() {
  return getAllFeedItems().map((item) => ({ id: item.id }))
}

/** 动态 OG metadata：用 item 自身的图片/海报作为分享缩略图 */
export async function generateMetadata({ params }) {
  const { id } = await params
  const items = getAllFeedItems()
  const item = items.find((i) => i.id === id)
  if (!item) return {}

  const SITE_URL = 'https://2aran.com'
  const canonical = `${SITE_URL}/feed/${id}`

  // 找出该 item 最合适的缩略图
  let ogImage
  if (item.type === 'image') {
    ogImage = item.src?.startsWith('http') ? item.src : `${SITE_URL}${item.src}`
  } else if (item.type === 'video' && item.poster) {
    ogImage = item.poster?.startsWith('http') ? item.poster : `${SITE_URL}${item.poster}`
  } else if (item.type === 'link' && item.image) {
    ogImage = item.image?.startsWith('http') ? item.image : `${SITE_URL}${item.image}`
  }
  // quote 类型或无图时，走同目录 opengraph-image.jsx 动态生成文字卡片
  // （不设 images，Next.js 会自动找 opengraph-image 文件）

  const description = item.summary || item.quote || item.title

  return {
    title: `${item.title} · 灵感 · 涂阿燃`,
    description,
    alternates: { canonical },
    openGraph: {
      title: item.title,
      description,
      url: canonical,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: item.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function FeedItemPage({ params }) {
  const { id } = await params
  const items = getAllFeedItems()
  const item = items.find((i) => i.id === id)

  if (!item) notFound()

  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="feed" slug="index" />
      <FeedClient items={items} typesPresent={getFeedTypesPresent()} featuredItemId={id} />

      <p className="mt-12 border-t border-[var(--site-line)] pt-6 text-center text-[11px] text-[var(--site-muted)]">
        持续更新 · 内容由 TUARAN 精选整理，版权归原作者所有，仅作分享与学习
      </p>
    </PageContainer>
  )
}
