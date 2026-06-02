// 长期罗盘明文 payload 的 schema + 迁移
//
// 注意：这里管的是「加密包裹里的明文对象」的 schema，
//      不是密文信封（envelope）的版本。envelope 版本在 crypto.js 里。
//
// 演进策略：每次给 plain 加字段，CURRENT_PLAIN_VERSION 加 1，
//          并在 migrate() 中写从旧版到新版的转换逻辑。

export const CURRENT_PLAIN_VERSION = 1

// 已知 kind 集合（snapshot/strategy/review）
// 未来添加 kind 时在这里登记 + 在 KIND_LABELS 里加标签
export const KINDS = Object.freeze(['snapshot', 'strategy', 'review'])

export const KIND_LABELS = Object.freeze({
  snapshot: '资产现状',
  strategy: '行动框架',
  review: '阶段复盘',
})

export function isValidKind(value) {
  return KINDS.includes(value)
}

/**
 * 当前明文 schema（v1）：
 *   {
 *     title: string,
 *     summary?: string,
 *     content: string,        // markdown
 *     updatedAt?: number,     // unix ms
 *     authoredBy?: string,    // 整理者签名（如 "Opus 4.7 High · 2026-06-02"）
 *     schemaVersion?: number, // 缺省视为 1
 *   }
 */
export function migrate(plain) {
  if (!plain || typeof plain !== 'object') {
    return { title: '未命名', content: '', schemaVersion: CURRENT_PLAIN_VERSION }
  }

  const version = Number(plain.schemaVersion) || 1

  // 当前只有 v1，未来 v1→v2 时在这里加 if 分支
  // if (version < 2) plain = upgradeV1ToV2(plain)

  return {
    title: String(plain.title || '未命名'),
    summary: plain.summary ? String(plain.summary) : '',
    content: String(plain.content || ''),
    updatedAt: Number(plain.updatedAt) || 0,
    authoredBy: plain.authoredBy ? String(plain.authoredBy) : '',
    schemaVersion: CURRENT_PLAIN_VERSION,
    _migratedFrom: version,
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
