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
  companies: '公司观察',
  topics: '专题分析',
  people: '人物',
  // 本文件登记的合成 category
  resource: '资源',
  feed: '灵感',
}

/** category → 大类（用于数据中心按类型汇总） */
export const CONTENT_TYPE_GROUP = {
  companies: '分析',
  topics: '分析',
  people: '分析',
  resource: '资源',
  feed: '灵感',
}

export const CONTENT_PV_ENTRIES = [
  { category: 'resource', slug: 'bookmarks', title: '资源收藏', href: '/bookmarks', summary: '按主题整理的外部材料、教程与工具入口。', tags: ['收藏', '资源', '工具'] },
  { category: 'resource', slug: 'edge-agent-development', title: '边缘智能体开发实战', href: '/resources/edge-agent-development', date: '2026-07-13', summary: '从 Agent 原型到 Cloudflare 边缘 SaaS 的 6 章 16 节工程化课程目录与学习路线。', tags: ['AI Agent', 'Cloudflare Workers', '边缘计算', '课程'] },
  { category: 'resource', slug: 'ai-learning-library', title: '安东尼学 AI', href: '/resources/ai-learning-library', date: '2026-07-13', summary: '按机器学习、深度学习、NLP、计算机视觉与工程实践整理的 AI 经典书目和学习资料索引。', tags: ['AI 学习', '机器学习', '深度学习', 'NLP', '计算机视觉', '书单'] },
  { category: 'resource', slug: 'nano-banana-gallery', title: 'Awesome Nano Banana Images', href: '/resources/nano-banana-gallery', date: '2026-07-13', summary: '141 个 Nano Banana 与 Nano Banana Pro 图像生成、编辑案例，支持搜索、输入输出对比和一键复制提示词。', tags: ['Nano Banana', 'AI 图片', '提示词', '图像编辑', 'AI'] },
  { category: 'resource', slug: 'ai-music', title: 'GPT 不解释｜AI 音乐', href: '/resources/ai-music', date: '2026-07-10', summary: 'tuaran 的 AI 音乐单曲《GPT 不解释》，可跳转网易云音乐播放并分享站内卡片。', tags: ['AI 音乐', 'GPT 不解释', 'tuaran', '音乐'] },
  { category: 'resource', slug: 'wallpapers', title: '壁纸下载', href: '/resources/wallpapers', date: '2026-07-10', summary: '按主题整理的可下载壁纸资源，支持分类筛选与原图下载。', tags: ['壁纸', '下载', '视觉资源'] },
  { category: 'resource', slug: '2aran-desktop', title: '2aran 桌面应用', href: '/resources/2aran-desktop', date: '2026-07-11', summary: 'Windows 与 macOS 测试版安装包领取页，按系统选择版本。', tags: ['桌面应用', 'Windows', 'macOS', '工具'] },
  { category: 'resource', slug: 'x-mutual-cleaner-extension', title: 'X 互关清理助手', href: '/resources/x-mutual-cleaner-extension', date: '2026-07-11', summary: '本地运行的 Chrome 工具包，帮助清理未回关账号。', tags: ['X 平台', 'Chrome 插件', '工具'] },
  { category: 'resource', slug: 'x-tweet-to-pdf-extension', title: 'X 推文转 PDF', href: '/resources/x-tweet-to-pdf-extension', date: '2026-07-14', summary: '把当前 X 推文整理成保留正文、作者、图片和原文链接的 A4 PDF。', tags: ['X 平台', 'Chrome 插件', 'PDF', '工具'] },
  { category: 'resource', slug: 'speedrun-investing', title: '速通投资', href: '/resources/speedrun-investing', date: '2026-07-09', summary: '把投资书单整理成一页可执行资源：价值投资、市场随机性、风险周期、财报、投资大师和金钱心理学。', tags: ['投资', '书单', '价值投资', '财报', '资源'] },
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
  { category: 'resource', slug: 'x-mutual-aid-circle', title: 'X 互帮互助圈子：真实互动，一起把 X 流量玩明白', href: '/x-mutual-aid-circle', tags: ['Twitter', 'X 平台', '社群', '工具', '多维页面'] },
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
