/**
 * 可安装工具的兼容视图。
 *
 * 公开目录已经统一到 /tools；下载属性以 toolItems.js 为唯一数据源。
 * 这些导出继续供作品聚合和既有调用使用，不再维护第二份条目。
 */

import { sortCatalogItemsByDate } from './catalogDateSort.js'
import { TOOL_ITEMS } from './toolItems.js'

export const DOWNLOAD_TYPE_META = [
  {
    id: 'extension',
    anchor: 'extensions',
    title: '浏览器扩展',
    titleEn: 'Browser Extensions',
    description: '装进 Chrome / Edge，在网页里完成本地工作流。',
  },
  {
    id: 'desktop',
    anchor: 'desktop',
    title: '桌面应用',
    titleEn: 'Desktop Apps',
    description: '装到 Windows 或 macOS 本机使用的客户端。',
  },
]

export const DOWNLOAD_ITEMS = TOOL_ITEMS
  .filter((item) => item.downloadType)
  .map((item) => ({
    ...item,
    type: item.downloadType,
    status: item.downloadStatus,
  }))

export const BROWSER_EXTENSION_WORK_ITEMS = DOWNLOAD_ITEMS
  .filter((item) => item.type === 'extension')
  .map((item) => ({ ...item, type: 'browser-extension', download: false }))

export const DESKTOP_APP_WORK_ITEMS = DOWNLOAD_ITEMS
  .filter((item) => item.type === 'desktop')
  .map((item) => ({ ...item, type: 'desktop-app', download: false }))

export function getDownloadTypeMeta(type) {
  return DOWNLOAD_TYPE_META.find((item) => item.id === type) || null
}

export function getDownloadItemsByType(type) {
  return sortCatalogItemsByDate(DOWNLOAD_ITEMS.filter((item) => item.type === type))
}

export function getDownloadItemsByDate() {
  return sortCatalogItemsByDate(DOWNLOAD_ITEMS)
}
