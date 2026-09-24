import { AUTOMATION_REGISTRY } from './adminOpsRegistry.js'
import { workflowIdFromAlertKey, workflowIdFromEntry } from './automationLastRun.js'
import { parseRssArticleKey, rssUpdateHref } from './rssUpdateCore.js'

export { isInteractionNotification } from './siteNotificationsCore.js'

export const NOTIFICATION_TYPE_META = {
  comment_reply: {
    category: 'interaction',
    typeLabel: '回复',
    actionLabel: '查看回复',
    fallbackHref: '/community',
  },
  content_comment: {
    category: 'interaction',
    typeLabel: '评论',
    actionLabel: '查看评论',
    fallbackHref: '/community',
  },
  content_like: {
    category: 'interaction',
    typeLabel: '点赞',
    actionLabel: '打开内容',
    fallbackHref: '/',
  },
  weekly_summary: {
    category: 'interaction',
    typeLabel: '周报',
    actionLabel: '打开周报',
    href: '/admin/content-weekly?days=7#notification-destination',
  },
  automation_monitor: {
    category: 'automation',
    typeLabel: '监控',
    actionLabel: '查看这次失败',
    fallbackHref: '/admin/ops',
  },
  rss_update: {
    category: 'rss',
    typeLabel: '订阅',
    actionLabel: '打开订阅源',
    fallbackHref: '/crypto-research/rss',
  },
}

export function notificationTypeMeta(type) {
  return NOTIFICATION_TYPE_META[type] || NOTIFICATION_TYPE_META.comment_reply
}

export function notificationTitle(type, actorName) {
  const name = String(actorName || '').trim()
  if (type === 'content_like') return `${name || '有人'} 点赞了你的内容`
  if (type === 'content_comment') return `${name || '有人'} 评论了你的内容`
  if (type === 'weekly_summary') return '上周站点总结已生成'
  if (type === 'automation_monitor') return `${name || '自动化任务'} 运行失败`
  if (type === 'rss_update') return `${name || '订阅源'} 有新更新`
  return `${name || '有人'} 回复了你`
}

export function notificationArticleTitle(type, actorName, resolvedTitle) {
  if (type === 'weekly_summary') return '站点周报'
  if (type === 'automation_monitor') return String(actorName || '自动化任务').trim()
  if (type === 'rss_update') return String(actorName || 'RSS').trim()
  return String(resolvedTitle || '').trim()
}

export function automationMonitorHref(articleKey) {
  const workflow = workflowIdFromAlertKey(articleKey)
  if (!workflow) return '/admin/ops'
  const item = AUTOMATION_REGISTRY.find((entry) => entry.id === workflow || workflowIdFromEntry(entry.entry) === workflow)
  if (!item?.id) return '/admin/ops'
  return `/admin/ops?task=${encodeURIComponent(item.id)}`
}

export function notificationHref({ type, articleKey, commentId, contentHref } = {}) {
  if (type === 'automation_monitor') return automationMonitorHref(articleKey)
  const meta = notificationTypeMeta(type)
  if (meta.href) return meta.href

  if (type === 'rss_update') {
    const { feedId, guid } = parseRssArticleKey(articleKey)
    const href = rssUpdateHref(feedId, guid)
    return feedId ? `${href}#rss-feed-${feedId}` : href
  }

  const pageHref = String(contentHref || '').trim().split('#')[0]
  if (!pageHref) return meta.fallbackHref || '/notifications'

  if (type === 'content_like') return `${pageHref}#article-like`
  const id = Number(commentId) || 0
  return id > 0 ? `${pageHref}#comment-${id}` : `${pageHref}#comments`
}

export function notificationDestinationLabel(type, articleTitle) {
  const action = notificationTypeMeta(type).actionLabel
  const title = String(articleTitle || '').trim()
  if (!title) return action
  if (type === 'weekly_summary' || type === 'automation_monitor') return action
  return `${action} · ${title}`
}

export function presentNotification(row = {}, resolved = {}) {
  const type = row.type || 'comment_reply'
  const meta = notificationTypeMeta(type)
  const actorName = row.actor_user_name || ''
  const articleTitle = notificationArticleTitle(type, actorName, resolved.title)
  return {
    type,
    category: meta.category,
    typeLabel: meta.typeLabel,
    title: notificationTitle(type, actorName),
    articleTitle,
    href: notificationHref({
      type,
      articleKey: row.article_key,
      commentId: row.comment_id,
      contentHref: resolved.href,
    }),
    destinationLabel: notificationDestinationLabel(type, articleTitle),
    messageExcerpt: row.message_excerpt || '',
  }
}
