import { articles } from './articles/articlesData'
import { listResearch } from '../../lib/research/loader'

const SITE_URL = 'https://2aran.com'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export const revalidate = 3600

export default function sitemap() {
  const now = new Date()

  const articleEntries = articles
    .filter((article) => !isExternalHref(article.href) && article.slug !== 'diary-self-reflection')
    .map((article) => {
    const parsedDate = Number.isNaN(Date.parse(article.date)) ? now : new Date(article.date)

    return {
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: parsedDate,
    }
  })

  const researchEntries = listResearch().map((entry) => {
    const parsed = entry.date ? Date.parse(entry.date) : NaN
    return {
      url: `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`,
      lastModified: Number.isNaN(parsed) ? now : new Date(parsed),
    }
  })

  const staticRoutes = [
    '',
    '/about',
    '/services',
    '/articles',
    '/ai-projects',
    '/context-memory',
    '/bookmarks',
    '/bookmarks/twitter',
    '/bookmarks/youtube',
    '/bookmarks/llm-tutorials',
    '/bookmarks/dev-resources',
    '/bookmarks/ai-tools',
    '/community',
    '/changelog',
    '/diary',
    '/donate',
    '/eatwhat',
    '/messages',
    '/people',
    '/people/elon-musk',
    '/people/su-shi',
    '/people/ai-pioneers',
    '/history/ming-qing',
    '/classical-masterpieces',
    '/ru-shi-dao',
    '/china-politics',
    '/reading',
    '/traffic',
    '/web-llm',
    '/writing-monetization-2026',
    '/xiaomoli-dad-todo',
  ]

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...articleEntries,
    ...researchEntries,
  ]
}
