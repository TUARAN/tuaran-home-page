import { articles as sourceArticles } from '../app/(site)/articles/articlesData'
import manifest from '../data/content-archive.json'

const slugs = new Set(manifest.articleSlugs)
export const articles = sourceArticles.filter((article) => slugs.has(article.slug))
