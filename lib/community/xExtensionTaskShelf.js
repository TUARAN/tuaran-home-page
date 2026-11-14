/** Task shelf for the X extension docs and derived bundles.

One record per task. The running extension still ships every task.
A derived plugin is this bundle, not a second copy of the scheduler.
*/

export const X_EXTENSION_SHARED_MODULES = Object.freeze([
  'background.js',
  'content.js',
  'content.css',
  'receipt.js',
])

export const X_EXTENSION_TASK_GROUPS = Object.freeze([
  { id: 'reply', label: '评论' },
  { id: 'likes', label: '点赞' },
  { id: 'mutual', label: '关注' },
  { id: 'poster', label: '发帖' },
  { id: 'community', label: '社群' },
  { id: 'clean', label: '清理' },
])

export const X_EXTENSION_TASK_SHELF = Object.freeze([
  { id: 'notifications', label: '评论回复', group: 'reply', shelf: 'listed', queueDefault: true, modules: ['loop.js'], summary: '只处理所选时间内的通知，默认 2 小时。扫完就把页签交回队列。' },
  { id: 'timeline', label: '评论首页', group: 'reply', shelf: 'listed', queueDefault: true, modules: ['loop.js'], summary: '在首页推荐流里评论。按轮次和条数做完这一次，再回到队尾。' },
  { id: 'kol', label: '评论大V', group: 'reply', shelf: 'listed', queueDefault: true, modules: ['loop.js', 'kolRoster.js', 'leaderboard.js'], summary: '每次从榜单换五个新人。慢、中、快、超快分别最多 3、5、7、11 条。' },
  { id: 'poster-premium', label: '精品发帖', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['poster.js'], summary: '只在五个固定档位的 15 分钟内入队。错过的档位不补发。默认不进队列。' },
  { id: 'poster', label: '纯文字帖', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['poster.js'], summary: '确认发出一条后让出页签，再按速度档等待下一条。默认不进队列。' },
  { id: 'poster-x', label: 'X主题发帖', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['poster.js'], summary: '调试中。默认不进队列。每次确认一条后让位。' },
  { id: 'poster-xhs', label: '小红书发帖', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['poster.js', 'vendor/xhs-textcard/bundle.js'], summary: '默认不进队列。取材和发送仍走发帖运行时。' },
  { id: 'article', label: '普通发文', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['articleDraft.js'], summary: '写成一篇中文文章放进 X 草稿，不点发布。默认不进队列。' },
  { id: 'site-forward', label: '站长转发', group: 'poster', shelf: 'listed', queueDefault: false, modules: ['siteForward.js'], summary: '当天 14:00 后把一篇站内文章发成 X Article。当天发过就不再入队。' },
  { id: 'community-share', label: '社群分发', group: 'community', shelf: 'listed', queueDefault: false, modules: ['communityShare.js'], summary: '把当前账号最新帖子发给可点击的群聊。默认不进队列。' },
  { id: 'prune-posts', label: '清理低质帖', group: 'clean', shelf: 'listed', queueDefault: false, modules: ['prunePosts.js'], summary: '按天数和阅读清理自己的帖子。默认不进队列，约每周一次。' },
  { id: 'prune-replies', label: '清理低质评论', group: 'clean', shelf: 'listed', queueDefault: false, modules: ['prunePosts.js'], summary: '只删发布满 30 天且没有互动的自己评论。默认不进队列。' },
  { id: 'likes-posts', label: '点赞帖子', group: 'likes', shelf: 'listed', queueDefault: true, modules: ['autoLike.js'], summary: '短轮点赞帖子，做完这一轮就回到队尾。' },
  { id: 'likes-replies', label: '点赞评论', group: 'likes', shelf: 'listed', queueDefault: true, modules: ['autoLike.js'], summary: '短轮点赞评论，和点赞帖子分开计数。' },
  { id: 'mutual-followBack', label: '回关粉丝', group: 'mutual', shelf: 'listed', queueDefault: true, modules: ['mutual.js'], summary: '约每周一次。一次回关 5、10 或 15 人，默认 15 人。看到速度限制就结束本次。' },
  { id: 'mutual-targetFollow', label: '关注候选', group: 'mutual', shelf: 'listed', queueDefault: true, modules: ['mutual.js', 'leaderboard.js'], summary: '每次换五个新人。一次关注 5、10 或 15 人，默认 15 人。看到速度限制就结束本次。' },
  { id: 'mutual-unfollow', label: '清理未回关', group: 'mutual', shelf: 'listed', queueDefault: false, modules: ['mutual.js'], summary: '只处理确认没有回关的人。默认不进队列，约每周一次。' },
  { id: 'mutual-unfollowNonSc', label: '清理非简中', group: 'mutual', shelf: 'listed', queueDefault: false, modules: ['mutual.js'], summary: '只处理名字或简介没有简体字的账号。和清理未回关分开，默认不进队列。' },
])

export function taskShelfById(id, shelf = X_EXTENSION_TASK_SHELF) {
  return shelf.find((task) => task.id === id) || null
}

export function listedShelfTasks(shelf = X_EXTENSION_TASK_SHELF) {
  return shelf.filter((task) => task.shelf === 'listed')
}

export function deriveTaskBundle(selectedIds, shelf = X_EXTENSION_TASK_SHELF) {
  const ids = [...new Set((selectedIds || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const missing = ids.filter((id) => !taskShelfById(id, shelf))
  const unlisted = ids.filter((id) => taskShelfById(id, shelf)?.shelf !== 'listed')
  if (!ids.length || missing.length || unlisted.length) {
    return { ok: false, missing, unlisted, bundle: null }
  }
  const tasks = ids.map((id) => taskShelfById(id, shelf))
  const modules = [...new Set(tasks.flatMap((task) => task.modules))].sort()
  return {
    ok: true,
    missing: [],
    unlisted: [],
    bundle: {
      kind: 'x-extension-task-bundle',
      tasks: tasks.map((task) => task.id),
      modules,
      shared: [...X_EXTENSION_SHARED_MODULES],
    },
  }
}
