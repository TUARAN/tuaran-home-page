/**
 * 公开站 H5 壳层：底部 Tab 与首页入口。
 * 桌面主导航仍以 lib/site/siteNav.js 的 SITE_CHANNELS 为准；这里只做移动端高频入口。
 * 首页入口按「文章 / 互动 / 圈子」分组，标题和目的地一起出现在 H5 首页。
 */

import { SITE_CHANNELS } from './siteNav'

const contentChannel = SITE_CHANNELS.find((channel) => channel.key === 'content')
const toolsChannel = SITE_CHANNELS.find((channel) => channel.key === 'tools')
const systemsChannel = SITE_CHANNELS.find((channel) => channel.key === 'systems')
const communityChannel = SITE_CHANNELS.find((channel) => channel.key === 'community')

function matchChannel(channel, pathname, searchParams) {
  return Boolean(channel?.match?.(pathname, searchParams))
}

export const SITE_MOBILE_TABS = [
  {
    key: 'home',
    href: '/',
    label: '首页',
    labelEn: 'Home',
    icon: 'home',
    match: (pathname) => pathname === '/',
  },
  {
    key: 'content',
    href: '/articles',
    label: '内容',
    labelEn: 'Read',
    icon: 'content',
    match: (pathname, searchParams) =>
      matchChannel(contentChannel, pathname, searchParams)
      || pathname?.startsWith('/frontend-weekly'),
  },
  {
    key: 'tools',
    href: '/tools',
    label: '工具',
    labelEn: 'Tools',
    icon: 'tools',
    match: (pathname, searchParams) =>
      matchChannel(toolsChannel, pathname, searchParams)
      || matchChannel(systemsChannel, pathname, searchParams),
  },
  {
    key: 'community',
    href: '/circles',
    label: '圈子',
    labelEn: 'Circle',
    icon: 'community',
    match: (pathname, searchParams) =>
      matchChannel(communityChannel, pathname, searchParams)
      || pathname?.startsWith('/checkin'),
  },
  {
    key: 'me',
    href: '/account',
    label: '我的',
    labelEn: 'Me',
    icon: 'me',
    match: (pathname) =>
      pathname?.startsWith('/account')
      || pathname?.startsWith('/login')
      || pathname?.startsWith('/register')
      || pathname?.startsWith('/notifications')
      || pathname?.startsWith('/messages'),
  },
]

export const HOME_MOBILE_CHANNELS = [
  {
    key: 'articles',
    label: '文章',
    labelEn: 'Articles',
    items: [
      { key: 'feed', href: '/#articles', label: '推荐阅读', labelEn: 'Reading' },
      { key: 'weekly', href: '/frontend-weekly', label: '周看', labelEn: 'Weekly' },
      { key: 'web3', href: '/web3', label: '市场', labelEn: 'Markets' },
      { key: 'ai', href: '/articles?subject=ai_dev', label: 'AI 与开发', labelEn: 'AI & development' },
      { key: 'companies', href: '/articles?subject=company_research', label: '公司调研', labelEn: 'Company research' },
      { key: 'practice', href: '/articles?group=practice', label: '工程实践', labelEn: 'Practice' },
    ],
  },
  {
    key: 'interactive',
    label: '互动',
    labelEn: 'Interactives',
    items: [
      { key: 'rich-pages', href: '/rich-pages', label: '互动专题', labelEn: 'Interactives' },
    ],
  },
  {
    key: 'community',
    label: '圈子',
    labelEn: 'Circles',
    items: [
      { key: 'circles', href: '/circles', label: '交友进社群', labelEn: 'Join circles' },
      { key: 'plaza', href: '/community', label: '交流广场', labelEn: 'Community' },
    ],
  },
]

export function getActiveMobileTab(pathname, searchParams) {
  return SITE_MOBILE_TABS.find((tab) => tab.match(pathname, searchParams)) || null
}
