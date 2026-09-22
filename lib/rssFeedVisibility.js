import { RSS_SELF_FEED_ID } from './rssUpdateCore.js'

export function isPublishedRssRow(row) {
  return Number(row?.published) === 1
}

export function isSelfRssFeed(rowOrFeed) {
  const id = String(rowOrFeed?.id || '').trim()
  if (id === RSS_SELF_FEED_ID) return true
  const siteUrl = String(rowOrFeed?.site_url || rowOrFeed?.siteUrl || '').toLowerCase()
  const rssUrl = String(rowOrFeed?.rss_url || rowOrFeed?.rssUrl || '').toLowerCase()
  return /(?:^|\/\/|\.)2aran\.com(?:\/|$)/.test(siteUrl) || /(?:^|\/\/|\.)2aran\.com(?:\/|$)/.test(rssUrl)
}

export function rowToPublicRssFeed(row) {
  return {
    id: row.id,
    siteName: row.site_name || '',
    siteUrl: row.site_url || '',
    rssUrl: row.rss_url || '',
    description: row.description || '',
    category: row.category || '',
    sortOrder: Number(row.sort_order) || 0,
    createdAt: Number(row.created_at) || 0,
  }
}

/**
 * D1 查询成功后，数据库就是公开订阅墙的唯一真相源。
 * 内置种子只用于 D1 未绑定或表尚未迁移时兜底，不能覆盖后台的下架与删除状态。
 * 本站 RSS 走独立订阅入口，不进入「已收录的源」。
 */
export function listPublishedRssFeeds(rows = []) {
  return rows.filter(isPublishedRssRow).filter((row) => !isSelfRssFeed(row)).map(rowToPublicRssFeed)
}
