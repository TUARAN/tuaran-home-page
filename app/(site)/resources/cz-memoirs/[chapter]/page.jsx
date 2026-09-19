import { permanentRedirect } from 'next/navigation'

import {
  CZ_MEMOIR_BASE_PATH,
  CZ_MEMOIR_CHAPTERS,
  CZ_MEMOIR_COVER,
  CZ_MEMOIR_FIRST_CHAPTER_SLUG,
  czMemoirChapterPath,
  getCzMemoirChapter,
} from '../../../../../lib/czMemoirs'
import CzMemoirChapterView from '../CzMemoirChapterView'

export const dynamic = 'force-static'
export const dynamicParams = false

const SITE_URL = 'https://2aran.com'

export function generateStaticParams() {
  return CZ_MEMOIR_CHAPTERS.map((chapter) => ({ chapter: chapter.slug }))
}

export async function generateMetadata({ params }) {
  const { chapter: slug } = await params
  const chapter = getCzMemoirChapter(slug)
  if (!chapter) return { title: '章节未找到' }

  const canonical = czMemoirChapterPath(chapter.slug)
  const title = `${chapter.title}｜赵长鹏自传《币安人生》`
  const description = `在线阅读赵长鹏（CZ）自传《币安人生》“${chapter.title}”，站内简体中文版，左侧可切换章节，并支持篇内导航、字号调整和上一篇/下一篇。`

  return {
    title,
    description,
    keywords: ['赵长鹏自传', '币安人生', 'CZ 回忆录', chapter.title, '在线阅读', '简体中文版'],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      siteName: '2aran.com',
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      images: [{ url: `${SITE_URL}${CZ_MEMOIR_COVER}`, width: 1200, height: 1600, alt: '赵长鹏自传《币安人生》封面' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}${CZ_MEMOIR_COVER}`],
    },
  }
}

export default async function CzMemoirChapterPage({ params }) {
  const { chapter: slug } = await params
  if (slug === CZ_MEMOIR_FIRST_CHAPTER_SLUG) {
    permanentRedirect(CZ_MEMOIR_BASE_PATH)
  }

  const chapter = getCzMemoirChapter(slug)
  const index = CZ_MEMOIR_CHAPTERS.findIndex((item) => item.slug === slug)
  const canonical = `${SITE_URL}${czMemoirChapterPath(slug)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: chapter?.title,
    url: canonical,
    inLanguage: 'zh-CN',
    position: index + 1,
    isPartOf: {
      '@type': 'Book',
      name: '币安人生',
      alternateName: 'CZ 回忆录',
      author: { '@type': 'Person', name: '赵长鹏', alternateName: 'CZ' },
      url: `${SITE_URL}${CZ_MEMOIR_BASE_PATH}`,
    },
  }

  return <CzMemoirChapterView slug={slug} jsonLd={jsonLd} />
}
