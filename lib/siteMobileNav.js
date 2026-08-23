/**
 * 公开站 H5 壳层：底部 Tab 与首页频道条。
 * 桌面主导航仍以 lib/siteNav.js 的 SITE_CHANNELS 为准；这里只做移动端高频入口。
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
    href: '/community',
    label: '圈子',
    labelEn: 'Circle',
    icon: 'community',
    match: (pathname, searchParams) => matchChannel(communityChannel, pathname, searchParams),
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
      || pathname?.startsWith('/notifications'),
  },
]

export const HOME_MOBILE_CHANNELS = [
  { key: 'feed', href: '/#articles', label: '推荐', labelEn: 'For you' },
  { key: 'weekly', href: '/frontend-weekly', label: '周看', labelEn: 'Weekly' },
  { key: 'ashare', href: '/a-share-research', label: 'A股', labelEn: 'A-share' },
  { key: 'sparks', href: '/feed', label: '灵感', labelEn: 'Sparks' },
  { key: 'tools', href: '/tools', label: '工具', labelEn: 'Tools' },
]

export function getActiveMobileTab(pathname, searchParams) {
  return SITE_MOBILE_TABS.find((tab) => tab.match(pathname, searchParams)) || null
}
