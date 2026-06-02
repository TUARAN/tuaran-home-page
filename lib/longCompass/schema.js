// 长期罗盘明文 payload 的 schema + 迁移
//
// 注意：这里管的是「加密包裹里的明文对象」的 schema，
//      不是密文信封（envelope）的版本。envelope 版本在 crypto.js 里。
//
// 演进策略：每次给 plain 加字段，CURRENT_PLAIN_VERSION 加 1，
//          并在 migrate() 中写从旧版到新版的转换逻辑。

// schema 演进历史：
//   v1: { title, summary, content, updatedAt, authoredBy }
//   v2: + theme: string[]（多主题标签，跨 kind 横切）
export const CURRENT_PLAIN_VERSION = 2

// kind 是「形式轴」：内容的呈现方式
export const KINDS = Object.freeze(['snapshot', 'strategy', 'review'])

export const KIND_LABELS = Object.freeze({
  snapshot: '资产现状',
  strategy: '行动框架',
  review: '阶段复盘',
})

// theme 是「主题轴」：内容讲的是什么领域。一条记录可挂多个。
export const THEMES = Object.freeze([
  '财务',
  '投资',
  '职业',
  '写作',
  '家庭',
  '育儿',
  '健康',
  '自我',
  '极简',
  '学习',
])

// 每个 theme 的色调（chip 渲染用），都用低饱和度
export const THEME_COLORS = Object.freeze({
  财务: 'bg-[#f4ecd8] text-[#7a5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]',
  投资: 'bg-[#f3e8d0] text-[#7a4520] dark:bg-[#2e1f12] dark:text-[#dba36d]',
  职业: 'bg-[#e8ecf2] text-[#445566] dark:bg-[#1f262f] dark:text-[#9aa6b6]',
  写作: 'bg-[#ede8f2] text-[#5e4d7a] dark:bg-[#26223a] dark:text-[#b5a8d4]',
  家庭: 'bg-[#f8ece8] text-[#a07060] dark:bg-[#33231f] dark:text-[#d6b1a3]',
  育儿: 'bg-[#f6ece5] text-[#a0795a] dark:bg-[#33271d] dark:text-[#d6bca0]',
  健康: 'bg-[#e8f2ec] text-[#3f6c52] dark:bg-[#1c2a22] dark:text-[#a0c9b2]',
  自我: 'bg-[#f5edea] text-[#876855] dark:bg-[#30261f] dark:text-[#c9b39e]',
  极简: 'bg-[#eef0eb] text-[#5d6649] dark:bg-[#23271e] dark:text-[#b3bca0]',
  学习: 'bg-[#ecf0f3] text-[#4a6275] dark:bg-[#1d242c] dark:text-[#a3b7c8]',
})

export function isValidKind(value) {
  return KINDS.includes(value)
}

export function isValidTheme(value) {
  return THEMES.includes(value)
}

/**
 * 把任意 plain payload 升级到 CURRENT_PLAIN_VERSION 的标准形态。
 * 旧记录解出来后调一次这个函数，就能用上新字段（缺省值合理）。
 */
export function migrate(plain) {
  if (!plain || typeof plain !== 'object') {
    return emptyPlain()
  }

  const version = Number(plain.schemaVersion) || 1
  let working = { ...plain }

  if (version < 2) {
    working = upgradeV1ToV2(working)
  }
  // 未来 v2 → v3 时在这里加 if 分支

  return {
    title: String(working.title || '未命名'),
    summary: working.summary ? String(working.summary) : '',
    content: String(working.content || ''),
    updatedAt: Number(working.updatedAt) || 0,
    authoredBy: working.authoredBy ? String(working.authoredBy) : '',
    theme: Array.isArray(working.theme) ? working.theme.filter(isValidTheme) : [],
    schemaVersion: CURRENT_PLAIN_VERSION,
    _migratedFrom: version,
  }
}

function upgradeV1ToV2(plain) {
  // v1 没有 theme 字段，默认空数组；上层 UI 仍然能渲染，只是 chip 处空
  return { ...plain, theme: Array.isArray(plain.theme) ? plain.theme : [] }
}

function emptyPlain() {
  return {
    title: '未命名',
    summary: '',
    content: '',
    updatedAt: 0,
    authoredBy: '',
    theme: [],
    schemaVersion: CURRENT_PLAIN_VERSION,
  }
}

/**
 * 把整理后的 plain 对象做一次最小输入校验（保存前用）。
 * 返回 { ok: boolean, error?: string }
 */
export function validatePlain(plain) {
  if (!plain || typeof plain !== 'object') return { ok: false, error: 'NOT_OBJECT' }
  if (!plain.title || typeof plain.title !== 'string') return { ok: false, error: 'TITLE_REQUIRED' }
  if (!plain.content || typeof plain.content !== 'string') return { ok: false, error: 'CONTENT_REQUIRED' }
  return { ok: true }
}
