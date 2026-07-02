/**
 * 自建阅读统计：非调研内容的可追踪清单（资源主题页 + 灵感流）。
 *
 * 复用既有的 research_pv / research_pv_hits 两张表（列就是通用的 category + slug），
 * 用合成 category 区分内容类型：
 *   - 'resource'：资源主题页（含文字资料、收藏、图谱等各类资源）
 *   - 'feed'    ：灵感流
 * 这样无需新建表/迁移，「内容数据周报 / 数据中心」按 (category, slug) 分组即可一并统计。
 *
 * 新增可统计页面：在这里登记一条，并在对应页面放 <ContentPvBeacon category slug />。
 */

export const CONTENT_TYPE_LABELS = {
  // 调研三类（research_pv 既有 category）
  companies: '公司调研',
  topics: '事项调研',
  people: '人物调研',
  // 本文件登记的合成 category
  resource: '资源',
  feed: '灵感',
}

/** category → 大类（用于数据中心按类型汇总） */
export const CONTENT_TYPE_GROUP = {
  companies: '调研',
  topics: '调研',
  people: '调研',
  resource: '资源',
  feed: '灵感',
}

export const CONTENT_PV_ENTRIES = [
  { category: 'resource', slug: 'classical-masterpieces', title: '单篇封神的中国古典名篇', href: '/classical-masterpieces', tags: ['中国古典文学', '诗歌', '辞赋', '人文'] },
  { category: 'resource', slug: 'ru-shi-dao', title: '儒释道 · 神仙体系', href: '/ru-shi-dao', tags: ['儒释道', '思想体系', '人文', '宗教'] },
  { category: 'resource', slug: 'china-politics', title: '中国政治体制', href: '/china-politics', tags: ['中国政治', '政经', '体制', '人文'] },
  { category: 'resource', slug: 'history-ming-qing', title: '历史资料：明清与三国', href: '/history/ming-qing', tags: ['历史', '明朝', '清朝', '三国', '人文'] },
  { category: 'resource', slug: 'reading', title: '书目索引', href: '/reading', tags: ['阅读', '书单', '人文'] },
  { category: 'resource', slug: 'bookmarks-twitter', title: '推特资讯', href: '/bookmarks/twitter', tags: ['Twitter', '资讯收藏', '观点'] },
  { category: 'resource', slug: 'bookmarks-youtube', title: 'YouTube 收藏', href: '/bookmarks/youtube', tags: ['YouTube', '视频', '资讯收藏'] },
  { category: 'resource', slug: 'bookmarks-llm-tutorials', title: '大模型教程', href: '/bookmarks/llm-tutorials', tags: ['大模型', 'LLM', 'AI', '教程'] },
  { category: 'resource', slug: 'bookmarks-ai-tools', title: 'AI 工具', href: '/bookmarks/ai-tools', tags: ['AI', '工具', 'AI 工具'] },
  { category: 'resource', slug: 'bookmarks-dev-resources', title: '开发资源', href: '/bookmarks/dev-resources', tags: ['开发', '前端', 'DevOps', '工具'] },
  { category: 'resource', slug: 'codex-learning-resource-map-yichen', title: 'Codex 学习资源收集', href: '/resources/codex-learning-resource-map-yichen', tags: ['Codex', 'AI', 'AI 编程', '教程'] },
  { category: 'resource', slug: 'x-mutual-cleaner-extension', title: 'X 平台一键取消没有回关你的人：浏览器插件下载', href: '/resources/x-mutual-cleaner-extension', tags: ['Twitter', '浏览器插件', '工具'] },
  { category: 'resource', slug: 'shen-zhi-ding-nei', title: '置身 X 内：大厂职场文本存档合集', href: '/resources/shen-zhi-ding-nei', tags: ['职场', '大厂', '互联网'] },
  { category: 'resource', slug: 'rss-blogroll', title: '我的 RSS 订阅', href: '/resources/rss', tags: ['RSS', '博客', '订阅'] },
  { category: 'feed', slug: 'index', title: '灵感流', href: '/feed', tags: ['灵感', '随笔'] },
]

/** 合成 category 集合（research-pv 接口放行用） */
export const CONTENT_PV_CATEGORIES = new Set(['resource', 'feed'])

/** key = `${category}/${slug}` */
export const CONTENT_PV_KEY_SET = new Set(CONTENT_PV_ENTRIES.map((e) => `${e.category}/${e.slug}`))

export const CONTENT_PV_META = Object.fromEntries(
  CONTENT_PV_ENTRIES.map((e) => [`${e.category}/${e.slug}`, e])
)

/** 解析任意 category/slug → { title, href, typeLabel }（调研在调用方用 catalog 补） */
export function resolveContentEntry(category, slug) {
  const key = `${category}/${slug}`
  const meta = CONTENT_PV_META[key]
  if (meta) {
    return { title: meta.title, href: meta.href, typeLabel: CONTENT_TYPE_LABELS[category] || category }
  }
  return null
}
