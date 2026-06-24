import { redirect, notFound } from 'next/navigation'
import { getAllFeedItems } from '../data'

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

/**
 * /feed/[id] → 重定向到 /feed#[id]
 * 这是一个「OG 落地页」，真正内容在 /feed#[id] 锚点处。
 * 分享时用 /feed/[id]，确保 social crawler 能读到正确的 og:image。
 */
export default async function FeedItemRedirectPage({ params }) {
  const { id } = await params
  const items = getAllFeedItems()
  const item = items.find((i) => i.id === id)

  if (!item) notFound()

  redirect(`/feed#${id}`)
}
