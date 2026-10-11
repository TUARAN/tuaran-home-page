import { weightedTextLength } from './xDistribution.js'

export const X_GENERIC_REPLY_LIBRARY = Object.freeze([
  '可以的。',
  '有搞头。',
  '有看头。',
  '感觉还不错。',
  '这个思路可以。',
  '值得继续看看。',
  '有点意思。',
  '确实值得关注。',
  '这个方向不错。',
  '挺有启发。',
  '说得挺实在。',
  '这个观察挺准。',
  '可以继续展开。',
  '期待后续。',
  '先关注一下。',
  '这个角度挺好。',
  '看起来有机会。',
  '思路挺清楚。',
  '确实有这种感觉。',
  '有参考价值。',
  '这个点抓得不错。',
  '值得琢磨一下。',
  '听起来靠谱。',
  '这个变化挺明显。',
  '方向是对的。',
  '有共鸣。',
  '先码住。',
  '挺实用的。',
  '这个判断有意思。',
  '继续观察。',
])

export function pickGenericXReply(random = Math.random) {
  const draw = Number(random())
  const index = Number.isFinite(draw)
    ? Math.min(X_GENERIC_REPLY_LIBRARY.length - 1, Math.max(0, Math.floor(draw * X_GENERIC_REPLY_LIBRARY.length)))
    : 0
  return X_GENERIC_REPLY_LIBRARY[index]
}

export function normalizeXReplyText(value) {
  return String(value || '')
    .replace(/```[a-z]*\n?|```/gi, '')
    .replace(/^回复[：:]\s*/u, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function validateXReplyText(value) {
  const text = normalizeXReplyText(value)
  if (!text) return { ok: false, error: 'REPLY_TEXT_REQUIRED', text: '' }
  if (weightedTextLength(text) > 280) return { ok: false, error: 'REPLY_TEXT_TOO_LONG', text }
  return { ok: true, text }
}

export function normalizeXPostTarget(value) {
  const raw = String(value || '').trim()
  if (/^\d{1,19}$/.test(raw)) {
    return { ok: true, postId: raw, url: `https://x.com/i/web/status/${raw}` }
  }

  let url
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, error: 'INVALID_X_POST_URL' }
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host !== 'x.com' && host !== 'twitter.com') {
    return { ok: false, error: 'INVALID_X_POST_URL' }
  }
  const match = url.pathname.match(/\/status\/(\d{1,19})(?:\/|$)/)
  if (!match) return { ok: false, error: 'INVALID_X_POST_URL' }
  return {
    ok: true,
    postId: match[1],
    url: `https://x.com/i/web/status/${match[1]}`,
  }
}

export function buildGenericXReplyMessages() {
  return [
    {
      role: 'system',
      content: [
        '你为中文 X 用户生成一条可复制的通用短回复。',
        '回复要自然、口语化、泛泛而谈，不假装读过不存在的细节，不给事实判断。',
        '长度控制在 4 到 18 个汉字，只输出一句话。',
        '不要使用话题标签、链接、@、引号、表情符号或“回复：”前缀。',
        '不要索要关注、点赞、转发，也不要出现夸张吹捧。',
        '可参考“有点意思”“值得继续看看”“这个方向不错”的松弛程度，但不要照抄。',
      ].join('\n'),
    },
    { role: 'user', content: '随机生成一条新的通用短回复。' },
  ]
}

export function sanitizeGeneratedXReply(value) {
  const text = normalizeXReplyText(value)
    .split('\n')[0]
    .replace(/^["“]|["”]$/g, '')
    .trim()
  if (!text || text.length > 36 || /[#@]|https?:\/\//i.test(text)) return ''
  return validateXReplyText(text).ok ? text : ''
}

export function xReplyTaskFromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    targetPostId: String(row.target_post_id || ''),
    targetUrl: String(row.target_url || ''),
    replyText: String(row.reply_text || ''),
    source: String(row.source || 'manual'),
    status: String(row.status || 'draft'),
    replyPostId: String(row.reply_post_id || ''),
    replyPostUrl: String(row.reply_post_url || ''),
    error: String(row.error || ''),
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
    publishedAt: Number(row.published_at) || 0,
  }
}
