/**
 * 可安装软件的下载中心。
 *
 * 落地页仍是各资源/工具页；这里只负责「扩展与客户端」这一份总目录。
 * 壁纸、调研附件、WorkBuddy 上架 ZIP 不进这份目录，各有自己的权威入口。
 */

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

export const DOWNLOAD_ITEMS = [
  {
    id: 'x-article-autopublisher',
    title: 'X Article 自动发布',
    href: '/resources/x-article-autopublisher-extension',
    type: 'extension',
    status: 'shipped',
    role: 'Chrome 扩展 · X 长文章自动发布',
    summary: '每天按北京时间从 2aran.com 领取一篇文章，保留正文标题、列表、引用、链接和图片，并自动写入与发布到 X Articles。',
    tags: ['Chrome Extension', 'X Articles', 'Scheduled Publishing'],
    domains: ['2aran.com', 'x.com'],
    actionLabel: '打开介绍与下载页',
    sourcePath: 'tools/x-article-autopublisher-extension',
    priority: 92,
  },
  {
    id: 'syncblog-publisher',
    title: 'Syncblog 同步助手',
    href: '/tools/syncblog-publisher',
    type: 'extension',
    status: 'shipped',
    role: 'Chrome 扩展 · 多平台内容同步',
    summary: 'AI 分发大师配套浏览器扩展，利用本地登录状态把编辑好的内容同步到多个平台。',
    tags: ['Chrome Extension', 'Content Sync', 'Syncblog'],
    domains: ['syncblog.cn'],
    actionLabel: '打开介绍与下载页',
    priority: 90,
  },
  {
    id: 'x-tweet-to-pdf',
    title: 'X 推文转 PDF',
    href: '/resources/x-tweet-to-pdf-extension',
    type: 'extension',
    status: 'shipped',
    role: 'Chrome / Edge 扩展 · 推文归档',
    summary: '提取当前 X 推文的作者、正文、时间、图片和原文链接，整理成适合 A4 打印与长期保存的 PDF。',
    tags: ['Chrome Extension', 'X/Twitter', 'PDF Archive'],
    domains: ['x.com', 'twitter.com'],
    actionLabel: '打开下载页',
    sourcePath: 'tools/x-tweet-to-pdf-extension',
    priority: 88,
  },
  {
    id: 'x-mutual-cleaner',
    title: 'X 互关清理助手',
    href: '/resources/x-mutual-cleaner-extension',
    type: 'extension',
    status: 'shipped',
    role: 'Chrome 扩展 / X Following 列表清理',
    summary: '在 X Following 页面扫描没有显示 Follows you 的账号，由用户确认后批量取消关注，内置数量上限、间隔和停止按钮。',
    tags: ['Chrome Extension', 'X/Twitter', 'Social Ops'],
    domains: ['x.com', 'twitter.com'],
    actionLabel: '打开下载页',
    sourcePath: 'tools/x-mutual-cleaner-extension',
    priority: 86,
  },
  {
    id: 'codex-model-switcher',
    title: 'Codex 模型切换器',
    href: '/resources/codex-model-switcher',
    type: 'desktop',
    status: 'shipped',
    role: 'macOS 应用 · Codex Provider 切换',
    summary: 'macOS 窗口与菜单栏工具，可切换 Codex 模型、查看本地用量并连接 Vibe Cafe；另提供安装 Skill。',
    tags: ['Desktop App', 'macOS', 'Codex'],
    platforms: ['macOS'],
    actionLabel: '打开下载页',
    priority: 90,
  },
  {
    id: '2aran-desktop',
    title: '2aran 桌面应用',
    href: '/resources/2aran-desktop',
    type: 'desktop',
    status: 'building',
    role: 'Windows / macOS 桌面客户端',
    summary: '面向 Windows 和 macOS 的桌面应用入口，后续承接站内工具、资源领取、通知和本地工作流。',
    tags: ['Desktop App', 'Windows', 'macOS'],
    platforms: ['Windows', 'macOS'],
    actionLabel: '查看下载',
    priority: 88,
  },
]

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
  return DOWNLOAD_ITEMS
    .filter((item) => item.type === type)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
}
