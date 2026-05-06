import { articles } from './articles/articlesData'

const SITE_URL = 'https://tuaran.me'

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

  const staticRoutes = [
    '',
    '/articles',
    '/ai-projects',
    '/bookmarks',
    '/bookmarks/twitter',
    '/bookmarks/llm-tutorials',
    '/bookmarks/dev-resources',
    '/bookmarks/ai-tools',
    '/bookmarks/people',
    '/community',
    '/diary',
    '/donate',
    '/messages',
    '/people',
    '/people/elon-musk',
    '/reading',
    '/reading/biography',
    '/reading/history',
    '/reading/philosophy',
    '/reading/psychology',
    '/reading/sociology',
    '/reading/wealth',
    '/traffic',
    '/web-llm',
    '/weekly',
    '/xiaomoli-dad-todo',
  ]

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...articleEntries,
  ]
}
