import { articles } from '../../../lib/articleMetadata'
import { COMMUNITY_TOPICS } from '../../../lib/communityTopics'
import { CZ_MEMOIR_CHAPTERS, czMemoirChapterPath } from '../../../lib/czMemoirs'
import { listResearch } from '../../../lib/research/archive'
import { listRichPageSitemapEntries } from '../../../lib/richPageSeo'
import { listStaticPageSitemapEntries } from '../../../lib/staticPageRegistry.mjs'
import { contentProofHref, listContentProofCredentials } from '../../../lib/contentProofRegistry.js'

const SITE_URL = 'https://2aran.com'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export const revalidate = 3600

export default function sitemap() {
  const articleEntries = articles
    .filter((article) => !isExternalHref(article.href) && article.slug !== 'diary-self-reflection')
    .map((article) => {
    const parsedDate = Date.parse(article.date)

    return {
      url: `${SITE_URL}/articles/${article.slug}`,
      ...(Number.isNaN(parsedDate) ? {} : { lastModified: new Date(parsedDate) }),
    }
  })

  const researchEntries = listResearch()
    .filter((entry) => !entry.encrypted)
    .map((entry) => {
      return {
        url: `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`,
        ...(entry.modifiedTime ? { lastModified: entry.modifiedTime } : {}),
      }
    })

  const entries = [
    ...listStaticPageSitemapEntries(SITE_URL),
    ...COMMUNITY_TOPICS.map((topic) => ({ url: `${SITE_URL}${topic.href}` })),
    ...CZ_MEMOIR_CHAPTERS.map((chapter) => ({
      url: `${SITE_URL}${czMemoirChapterPath(chapter.slug)}`,
      lastModified: new Date('2026-09-15T00:00:00+08:00'),
    })),
    ...articleEntries,
    ...researchEntries,
    ...listRichPageSitemapEntries(),
    ...listContentProofCredentials().map((credential) => ({
      url: `${SITE_URL}${contentProofHref(credential.contentKey)}`,
    })),
  ]

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values())
}
