import { selectRelatedContent } from './contentSelection.mjs'
/**
 * 统一内容管线：把「专栏文章 / 分析内容 / 资源主题页 / 灵感流」归一成同一形状，
 * 供相关阅读推荐、D1 内容索引同步、后台内容中心共用。
 *
 * 统一形状（entry）：
 *   contentKey  'research:{category}:{slug}' | 'article:{slug}' | 'resource:{slug}' | 'feed:{slug}'
 *   type        'research' | 'article' | 'resource' | 'feed'
 *   category    调研三类（companies/topics/people）或合成类（posts/resource/feed）
 *   slug / title / summary / tags[] / href / date('YYYY-MM-DD')
 *
 * 数据源都是构建期纯 JS 模块（research/catalog.js 为生成物），Edge 构建使用 contentPipelineRuntime.js，不能把此数据模块直接打入 Worker。
 * 约定：contentKey 前缀与评论 articleKey、燃币 gated_resources 的 resourceKey 一致，
 * 这样同一个 key 天然打通评论 / 解锁 / 相关阅读 / PV 四套系统。
 */

import { articles } from './articleMetadata'
import { CONTENT_PV_ENTRIES } from './contentRegistry'
import { RESEARCH_ENTRY_META } from './research/catalog'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => String(t || '').trim()).filter(Boolean)
}

function researchEntries() {
  return Object.values(RESEARCH_ENTRY_META).filter((meta) => !meta.encrypted).map((meta) => ({
    contentKey: `research:${meta.category}:${meta.slug}`,
    type: 'research',
    category: meta.category,
    slug: meta.slug,
    title: meta.title,
    summary: meta.summary || '',
    tags: normalizeTags(meta.tags),
    href: `/articles/research/${meta.category}/${meta.slug}`,
    date: meta.date || '',
  }))
}

function articleEntries() {
  return articles.map((article) => {
    const path = article.slug === 'diary-self-reflection' ? '/diary' : `/articles/${article.slug}`
    return {
      contentKey: `article:${article.slug}`,
      type: 'article',
      category: 'posts',
      slug: article.slug,
      title: article.title,
      summary: article.summary || '',
      tags: normalizeTags(article.tags),
      href: isExternalHref(article.href) ? article.href : path,
      date: article.date || '',
    }
  })
}

function registryEntries() {
  return CONTENT_PV_ENTRIES.filter((entry) => entry.audience !== 'owner').map((entry) => ({
    contentKey: `${entry.category}:${entry.slug}`,
    type: entry.category,
    category: entry.category,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary || '',
    tags: normalizeTags(entry.tags),
    href: entry.href,
    date: entry.date || '',
  }))
}

let cachedAll = null

/** 全量统一内容清单（构建期数据，进程内缓存）。 */
export function listAllContent() {
  if (!cachedAll) {
    cachedAll = [...articleEntries(), ...researchEntries(), ...registryEntries()]
  }
  return cachedAll
}

export function getContentByKey(contentKey) {
  return listAllContent().find((e) => e.contentKey === contentKey) || null
}

export function getRelatedContent(contentKey, options) {
  return selectRelatedContent(listAllContent(), contentKey, options)
}

export { CONTENT_PIPELINE_TYPE_LABELS } from './contentSelection.mjs'
