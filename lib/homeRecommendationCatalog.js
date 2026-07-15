import { articles } from '../app/(site)/articles/articlesData.js'
import { FEED_TYPE_META, getAllFeedItems } from '../app/(site)/feed/data.js'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems.js'
import { RESEARCH_ENTRY_META } from './research/catalog.js'
import { CATEGORY_META } from './research/categories.js'

function articleHref(article) {
  if (article?.slug === 'diary-self-reflection') return '/diary'
  return article?.href || `/articles/${article.slug}`
}

function articleTag(article) {
  if (article?.homeCategory) return article.homeCategory
  if (article?.slug === 'ocr-comparison-paddleocr-vl') return 'AI'
  if (article?.slug === 'content-os-blogger-matrix-alliance') return '创作'
  if (article?.slug === 'blogger-future-community') return '社区'
  if (article?.slug === 'diary-self-reflection') return '随笔'
  return '工程化'
}

/** Edge 安全的首页推荐完整候选池，也是后台人工置顶清单的真理源。 */
export function getHomeRecommendationCatalog() {
  const feeds = getAllFeedItems().map((item, index) => ({
    id: `feed:${item.id}`,
    href: `/feed/${item.id}`,
    section: 'feed',
    sectionLabel: '灵感',
    tagLabel: FEED_TYPE_META[item.type]?.label || '灵感',
    title: item.title,
    date: item.date,
    sortKey: item.date ? `${item.date}T${item.time || '00:00'}:00` : '',
    summary: item.summary,
    isLatest: index === 0,
  }))
  const columns = [...articles]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .map((article) => {
      const href = articleHref(article)
      return {
        id: `column:${article.slug || article.href || article.title}`,
        href,
        external: href.startsWith('http'),
        section: 'column',
        sectionLabel: '创作',
        tagLabel: articleTag(article),
        title: article.title,
        date: article.date,
        sortKey: article.date ? `${article.date}T00:00:00` : '',
        summary: article.summary,
      }
    })
  const research = Object.values(RESEARCH_ENTRY_META)
    .filter((entry) => !entry.encrypted)
    .map((entry) => ({
      id: `research:${entry.category}:${entry.slug}`,
      href: `/articles/research/${entry.category}/${entry.slug}`,
      section: 'research',
      sectionLabel: '分析',
      tagLabel: CATEGORY_META[entry.category]?.label || entry.category,
      title: entry.title,
      date: entry.date,
      sortKey: entry.date ? `${entry.date}T${entry.time || '00:00'}:00` : '',
      summary: entry.summary,
    }))
  const resources = HOME_RESOURCE_ITEMS.map((item) => ({
    id: `resource:${item.href}`,
    href: item.href,
    section: 'resources',
    sectionLabel: '资源',
    tagLabel: item.tagLabel.replace(/^资源库 · /, '').replace(/^资料库 · /, ''),
    title: item.title,
    date: item.date,
    sortKey: item.date ? `${item.date}T00:00:00` : '',
    summary: item.summary,
  }))
  return [...feeds, ...columns, ...research, ...resources]
}
