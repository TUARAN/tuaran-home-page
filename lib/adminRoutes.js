/** 旧 /agent-ops/* → /admin/* 映射（middleware 301 用） */
export const ADMIN_LEGACY_REDIRECTS = {
  '/agent-ops': '/admin',
  '/agent-ops/nav-admin': '/admin/nav',
  '/agent-ops/db-admin': '/admin/db',
  '/agent-ops/share-admin': '/admin/share',
  '/agent-ops/ops-console': '/admin/ops',
  '/agent-ops/project-portfolio': '/admin/portfolio',
}

/** admin.2aran.com 允许的路径前缀 */
export const ADMIN_HOST = 'admin.2aran.com'
export const ADMIN_HOST_ALLOW_PREFIXES = [
  '/admin',
  '/api/admin',
  '/api/private-records',
  '/login',
  '/register',
  '/api/auth',
  '/api/me',
]

export const ADMIN_CONSOLE_ITEMS = [
  {
    href: '/admin/portfolio',
    label: 'AI 项目管理台',
    shortLabel: '项目',
    desc: '项目治理 / 整合路线图 / Codex 工作区归化',
  },
  {
    href: '/admin/long-compass',
    label: '长期罗盘',
    shortLabel: '罗盘',
    desc: '加密私域 · 资产 / 复盘 / 行动框架',
  },
  {
    href: '/admin/users',
    label: '用户管理',
    shortLabel: '用户',
    desc: '注册用户目录 / 角色与封禁（member / trusted / blocked）',
  },
  {
    href: '/admin/nav',
    label: '菜单权限管理',
    shortLabel: '菜单',
    desc: '设置每个菜单项对谁可见（public / authed / owner）',
  },
  {
    href: '/admin/db',
    label: '数据库管理',
    shortLabel: '数据库',
    desc: 'D1 状态 / 表统计 / 迁移检查',
  },
  {
    href: '/admin/share',
    label: '加密分享管理',
    shortLabel: '分享',
    desc: 'E2E 加密的家庭文档分享链接',
  },
  {
    href: '/admin/ops',
    label: '自动化控制台',
    shortLabel: 'Ops',
    desc: 'ops.2aran.com 健康检查 / 外部 Agent Ops 入口',
  },
  {
    href: '/admin/research-style',
    label: '调研风格模版',
    shortLabel: '风格',
    desc: '调研类内容历代分寸 / 措辞快照（v0 → 当前生效版）',
  },
]

/** 主站私有工具：Dashboard 聚合入口，不迁入 admin 子域 */
export const ADMIN_PRIVATE_TOOL_LINKS = [
  { href: '/voice-tasks', label: '语音记事', desc: '随手说一段，落到文字' },
  { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', desc: '日常 / 习惯 / 家庭节奏' },
  { href: '/context-memory', label: '上下文记忆', desc: '工作记忆架构与快照' },
]

export function isAdminHostPathAllowed(pathname) {
  return ADMIN_HOST_ALLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
