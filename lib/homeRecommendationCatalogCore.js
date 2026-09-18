import { publicTaxonomyLabels, taxonomyForArticle, taxonomyForResearch, taxonomyForResource } from './contentTaxonomy.js'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems.js'
import { researchPublicSummary } from './researchPublicSummary.js'

function articleHref(article) {
  if (article?.slug === 'diary-self-reflection') return '/diary'
  return article?.href || `/articles/${article.slug}`
}

function withPublicLabels(item, taxonomy) {
  const labels = publicTaxonomyLabels(taxonomy)
  return {
    ...item,
    sectionLabel: labels.groupLabel,
    tagLabel: labels.subjectLabel,
    subjects: taxonomy.subjects,
  }
}

/** Edge 安全的首页文章推荐候选池，也是后台人工置顶清单的真理源。 */
export function buildHomeRecommendationCatalog(articles, researchEntries) {
  const columns = [...articles]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .map((article) => {
      const href = articleHref(article)
      return withPublicLabels({
        id: `column:${article.slug || article.href || article.title}`,
        href,
        external: href.startsWith('http'),
        section: 'column',
        title: article.title,
        date: article.date,
        sortKey: article.date ? `${article.date}T00:00:00` : '',
        summary: article.summary,
        tags: [article.homeCategory, ...(article.tags || [])].filter(Boolean),
      }, taxonomyForArticle({
        category: article.homeCategory,
        slug: article.slug,
        href,
        title: article.title,
      }))
    })
  const research = researchEntries
    .filter((entry) => !entry.encrypted)
    .map((entry) => withPublicLabels({
      id: `research:${entry.category}:${entry.slug}`,
      href: `/articles/research/${entry.category}/${entry.slug}`,
      section: 'research',
      title: entry.title,
      date: entry.date,
      sortKey: entry.sortKey || (entry.date ? `${entry.date}T${entry.time || '00:00'}:00` : ''),
      summary: researchPublicSummary(entry),
      tags: entry.tags || [],
    }, taxonomyForResearch(entry)))
  const resources = HOME_RESOURCE_ITEMS.map((item) => withPublicLabels({
    id: `resource:${item.href}`,
    href: item.href,
    section: 'resources',
    title: item.title,
    date: item.date,
    sortKey: item.date ? `${item.date}T00:00:00` : '',
    summary: item.summary,
    tags: [item.resourceType, item.tagLabel].filter(Boolean),
  }, taxonomyForResource(item)))
  return [...columns, ...research, ...resources]
}
