/** Shared X plugin monitor labels and schedule defaults for admin UI + server. */

export const X_RUNTIME_MODE_LABELS = Object.freeze({
  timeline: '评论首页',
  notifications: '评论回复',
  kol: '评论大V',
  'likes-posts': '点赞帖子',
  'likes-replies': '点赞评论',
  poster: '普通发帖',
  'poster-premium': '精品发帖',
  'poster-x': 'X主题发帖',
  article: '普通发文',
  'prune-posts': '清理低质帖',
  'mutual-unfollow': '清理未回关',
  'mutual-followBack': '回关粉丝',
  'mutual-targetFollow': '关注候选',
})

/** Align with extension defaultTaskPriority (评论回复 > … > 取消未回关). */
export const X_DEFAULT_TASK_PRIORITY = Object.freeze({
  notifications: 10,
  timeline: 9,
  kol: 8,
  'poster-premium': 8,
  poster: 7,
  'poster-x': 7,
  article: 7,
  'likes-posts': 6,
  'likes-replies': 6,
  'mutual-followBack': 5,
  'mutual-targetFollow': 4,
  'mutual-unfollow': 3,
  'prune-posts': 2,
})

export const X_SCHEDULE_PRIORITY_HINT = '优先级 1～10 分，分值越大越重要'

export const X_PRIORITY_LABELS = Object.freeze(Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => {
    const score = index + 1
    return [score, `${score}分`]
  }),
))

export function xPriorityLabel(priority) {
  const rank = Math.max(1, Math.min(10, Number(priority) || 1))
  return X_PRIORITY_LABELS[rank] || `${rank}分`
}

export const X_RUNTIME_GROUPS = Object.freeze([
  { id: 'reply', label: '评论 · 默认 8～10 分', modes: ['notifications', 'timeline', 'kol'] },
  { id: 'poster', label: '发帖 · 默认 2～8 分', modes: ['poster-premium', 'poster', 'poster-x', 'article', 'prune-posts'] },
  { id: 'likes', label: '点赞 · 默认 6 分（短轮约 3 分钟）', modes: ['likes-posts', 'likes-replies'] },
  { id: 'mutual', label: '关注 · 默认 3～5 分', modes: ['mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow'] },
])

export function defaultXTaskPriority(mode) {
  return Number(X_DEFAULT_TASK_PRIORITY[mode]) || 1
}
