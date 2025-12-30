import { articles } from './articles/articlesData'

const SITE_URL = 'https://tuaran.me'

export const revalidate = 3600

export default function sitemap() {
  const now = new Date()

  const articleEntries = articles.map((article) => {
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
    ...articleEntries,
  ]
}
