import { articles } from './articles/articlesData'

const SITE_URL = 'https://tuaran.me'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export const revalidate = 3600

export default function sitemap() {
  const now = new Date()

  const articleEntries = articles
    .filter((article) => !isExternalHref(article.href))
    .map((article) => {
    const parsedDate = Number.isNaN(Date.parse(article.date)) ? now : new Date(article.date)

    return {
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: parsedDate,
    }
  })

  return [
    {
      url: SITE_URL,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/biography`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/history`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/philosophy`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/psychology`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/sociology`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/reading/wealth`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/traffic`,
      lastModified: now,
    },
    ...articleEntries,
  ]
}
