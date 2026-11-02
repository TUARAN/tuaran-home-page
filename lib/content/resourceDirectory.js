import { TOOL_ITEMS } from '../site/toolItems.js'
import { getResourceCatalogItem } from './resourceCatalog.js'

const TOOL_HREFS = new Set(TOOL_ITEMS.map((item) => item.href.split(/[?#]/)[0]))

// 下载页沿用历史 /resources URL 和统计键，目录归属以工具清单和类型为准。
export function isToolDirectoryItem(item) {
  const href = String(item.href || '').split(/[?#]/)[0]
  const resourceKey = item.resourceKey || `resource:${item.slug || href.split('/').pop()}`
  return TOOL_HREFS.has(href)
    || href.startsWith('/tools/')
    || item.resourceType === 'tool'
    || getResourceCatalogItem(resourceKey)?.kind === 'tool'
}
