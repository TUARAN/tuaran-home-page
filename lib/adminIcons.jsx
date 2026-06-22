'use client'

/**
 * admin 图标映射：注册表（lib/adminRoutes.js）里只放字符串 key，
 * 这里把 key 映射到具体 Tabler 组件。
 *
 * 为什么分两个文件：adminRoutes.js 被 Edge middleware 引用，不能把 React 组件
 * 打进中间件 bundle。图标只在客户端组件里通过本文件取用。
 */
import {
  IconLayoutDashboard,
  IconFolders,
  IconTypography,
  IconUsers,
  IconMenu2,
  IconLockShare,
  IconDatabase,
  IconRobot,
  IconBrain,
  IconCompass,
  IconChartBar,
  IconBell,
  IconSettings,
  IconPlug,
  IconRouteAltLeft,
  IconCircleDot,
  IconArrowBackUp,
  IconFileText,
  IconCoin,
} from '@tabler/icons-react'

const ICONS = {
  dashboard: IconLayoutDashboard,
  articles: IconFileText,
  portfolio: IconFolders,
  researchStyle: IconTypography,
  modelDispatch: IconRouteAltLeft,
  users: IconUsers,
  nav: IconMenu2,
  share: IconLockShare,
  database: IconDatabase,
  ops: IconRobot,
  deepseekTasks: IconBrain,
  compass: IconCompass,
  analytics: IconChartBar,
  audit: IconBell,
  settings: IconSettings,
  integrations: IconPlug,
  ranbi: IconCoin,
  back: IconArrowBackUp,
}

export function AdminIcon({ name, size = 18, stroke = 1.6, className, ...rest }) {
  const Cmp = ICONS[name] || IconCircleDot
  return <Cmp size={size} stroke={stroke} className={className} aria-hidden="true" {...rest} />
}
