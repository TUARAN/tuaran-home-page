import { ENGINEERING_WORKS } from './engineeringWorks.js'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems.js'

const SITE_URL = 'https://2aran.com'

function versionedGuid(type, key, publishedAt) {
  return `urn:2aran:rss:${type}:${encodeURIComponent(key)}:${encodeURIComponent(publishedAt)}`
}

function notificationDate(entry) {
  return entry.updated || entry.date || ''
}

/**
 * 富页面与资源是长期维护页，不适合把页面正文复制进 RSS。
 * 每次内容更新时修改注册表里的 `updated`（可写日期或带时区的时间），
 * GUID 会随之变化，阅读器会把它识别成一条新的更新通知。
 */
export function listRichPageRssEntries(works = ENGINEERING_WORKS) {
  return works
    .filter((work) => work.audience !== 'owner' && work.href && notificationDate(work))
    .map((work) => {
      const publishedAt = notificationDate(work)
      return {
        title: work.title,
        link: `${SITE_URL}${work.href}`,
        description: work.summary || '',
        publishedAt,
        category: '互动专题',
        guid: versionedGuid('rich-page', work.id || work.href, publishedAt),
        ctaLabel: '打开互动专题',
      }
    })
}

export function listResourceRssEntries(resources = HOME_RESOURCE_ITEMS) {
  return resources
    .filter((resource) => {
      return (
        resource.href &&
        (resource.href.startsWith('/bookmarks/') || resource.href.startsWith('/resources/')) &&
        notificationDate(resource)
      )
    })
    .map((resource) => {
      const publishedAt = notificationDate(resource)
      const isBookmark = resource.href.startsWith('/bookmarks/')
      return {
        title: resource.title,
        link: `${SITE_URL}${resource.href}`,
        description: resource.summary || '',
        publishedAt,
        category: isBookmark ? '收藏' : '资源',
        guid: versionedGuid(isBookmark ? 'bookmark' : 'resource', resource.href, publishedAt),
        ctaLabel: isBookmark ? '打开收藏页' : '打开资源页',
      }
    })
}
