/**
 * 公开站 H5 壳层：底部 Tab。
 * 桌面主导航仍以 lib/site/siteNav.js 的 SITE_CHANNELS 为准；
 * 手机首页按 App 信息流呈现，频道切换交给底部菜单，不再另放网页式入口栏。
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

export function getActiveMobileTab(pathname, searchParams) {
  return SITE_MOBILE_TABS.find((tab) => tab.match(pathname, searchParams)) || null
}
