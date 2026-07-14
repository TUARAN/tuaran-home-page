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

  const researchEntries = listResearch()
    .filter((entry) => !entry.encrypted)
    .map((entry) => {
      const parsed = entry.dateTimeIso ? Date.parse(entry.dateTimeIso) : entry.date ? Date.parse(entry.date) : NaN
      return {
        url: `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`,
        lastModified: Number.isNaN(parsed) ? now : new Date(parsed),
      }
    })

  const staticRoutes = [
    '',
    '/about',
    '/editorial',
    '/services',
    '/articles',
    '/articles/creation-calendar',
    '/frontend-weekly',
    '/rich-pages',
    '/works',
    '/tools',
    '/tools/auto-commit',
    '/tools/github-follow',
    '/tools/syncblog-publisher',
    '/tools/openclaw-pr-helper',
    '/tools/multi-ip',
    '/browser-extensions',
    '/skill-center',
    '/context-memory',
    '/cancers-overview',
    '/platform-framework-pairs',
    '/ai-token-usage-research',
    '/skill-market-research',
    '/sun-moon-motion',
    '/tang-ping-map',
    '/x-mutual-aid-circle',
    '/zhang-juzheng-book',
    '/writing-monetization-2026',
    '/agent-world-cup',
    '/bookmarks/twitter',
    '/bookmarks/youtube',
    '/bookmarks/llm-tutorials',
    '/bookmarks/dev-resources',
    '/bookmarks/ai-tools',
    '/resources/rss',
    '/resources/ai-music',
    '/resources/ai-learning-library',
    '/resources/edge-agent-development',
    '/resources/nano-banana-gallery',
    '/resources/codex-learning-resource-map-yichen',
    '/resources/shen-zhi-ding-nei',
    '/resources/wallpapers',
    '/resources/x-mutual-cleaner-extension',
    '/community',
    '/changelog',
    '/diary',
    '/donate',
    '/eatwhat',
    '/messages',
    '/history/ming-qing',
    '/classical-masterpieces',
    '/ru-shi-dao',
    '/china-politics',
    '/reading',
    '/web-llm',
    '/xiaomoli-dad-todo',
  ]

  const entries = [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...articleEntries,
    ...researchEntries,
  ]

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values())
}
