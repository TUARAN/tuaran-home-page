// ============================================================
// 「灵感」短平快内容流（/feed）
//
// 用途：引流向板块。承载短平快的图片 / 视频 / 资源 / 观点。
// 更新方式：
//   1) 小于等于 25 MiB 的媒体可放 public/feed/，src 写 '/feed/xxx.mp4'
//   2) 大于 25 MiB 的媒体必须上传到 R2 的 feed/ 前缀，src 写 feedMediaUrl('feed/xxx.mp4')
//   3) git push → Cloudflare 重建上线
//
// 字段约定（按 type 取用对应字段）：
//   id        唯一 slug（全小写连字符，供锚点 #id 深链与 React key）
//   type      'video' | 'image' | 'link' | 'quote'
//   title     标题
//   summary   一句话说明（列表与卡片展示，可选）
//   tags      标签数组（可选）
//   date      'YYYY-MM-DD'（北京时间，倒序排列）
//   time      'HH:MM'（可选，同日内排序）
//   source    { label, href } 出处（可选）
//   ── type=video ──
//   src       视频地址（R2 URL 或外链）
//   poster    封面图（可选）
//   aspect    宽高比，如 '16/9' | '9/16' | '1/1'（默认 16/9）
//   ── type=image ──
//   src       图片地址
//   aspect    宽高比（可选）
//   ── type=link ──
//   href      外链地址
//   image     缩略图（可选）
//   ── type=quote ──
//   quote     引述正文
//   author    署名（可选）
// ============================================================

export const FEED_TYPE_META = {
  video: { label: '视频', labelEn: 'Video', accent: '#ff4d6a' },
  image: { label: '图片', labelEn: 'Image', accent: '#6c5ce7' },
  link: { label: '资源', labelEn: 'Resource', accent: '#00a978' },
  quote: { label: '观点', labelEn: 'Take', accent: '#f5a623' },
}

const DEFAULT_FEED_MEDIA_BASE = 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev'

const FEED_MEDIA_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE ||
  process.env.R2_PUBLIC_BASE ||
  DEFAULT_FEED_MEDIA_BASE
).replace(/\/+$/, '')

function feedMediaUrl(objectKey) {
  if (!objectKey) return ''
  if (/^https?:\/\//i.test(objectKey)) return objectKey
  return `${FEED_MEDIA_BASE}/${objectKey.replace(/^\/+/, '')}`
}

export const FEED_ITEMS = [
  {
    id: 'humanoid-robot-beauty-inspiration',
    type: 'video',
    title: '人形机器人的美妆灵感',
    summary:
      '当机器人开始拥有接近真人的面部、皮肤和表情，美妆就不再只是遮瑕、修饰和风格表达，也会变成一种“如何让非人类更像人、又保留一点异质感”的设计语言。这个方向很适合延展成 AI 影像、虚拟偶像、仿生机器人和未来美妆品牌的视觉参考。',
    tags: ['人形机器人', '美妆灵感', 'AI 影像', '仿生设计', '未来审美'],
    date: '2026-07-01',
    time: '16:59',
    src: feedMediaUrl('feed/humanoid-robot-beauty-inspiration-2026-07-02.mp4'),
    aspect: '16/9',
  },
  {
    id: 'gemma-4-agent-vllm-challenge',
    type: 'video',
    title: '上百个 AI 智能体协作优化 Gemma 4 推理',
    summary:
      'Hugging Face 工程师 Thom Wolf 记录了一场开放式协同实验：上百个 AI 智能体围绕 Gemma 4 推理加速挑战赛，在 vLLM 框架下分工优化，最终把推理速度提高约 5 倍。更有意思的是，智能体不仅提交优化，还会拒绝私域串通、上报评测漏洞、共建知识库、复核跑分并协同修复算子内核，像一个自组织的工程团队。',
    tags: ['AI Agent', 'Hugging Face', 'Gemma 4', 'vLLM', '推理加速'],
    date: '2026-06-29',
    time: '17:22',
    src: '/feed/gemma-4-agent-vllm-challenge.mp4',
    aspect: '16/9',
    source: {
      label: 'Thom Wolf / X',
      href: 'https://x.com/Thom_Wolf/status/2070134136304517284?s=20',
    },
  },
  {
    id: 'ai-restored-tom-and-jerry',
    type: 'video',
    title: '用 AI 还原猫和老鼠',
    summary:
      '把经典动画质感交给 AI 重新演绎：熟悉的追逐、夸张动作和复古镜头语言，被还原成一种介于怀旧与新技术之间的短片实验。',
    tags: ['AI 视频', '猫和老鼠', '经典动画', '影像修复'],
    date: '2026-06-29',
    time: '14:44',
    src: feedMediaUrl('feed/ai-restored-tom-and-jerry.mp4'),
    aspect: '16/9',
  },
  {
    id: 'midjourney-future-city',
    type: 'video',
    title: 'Midjourney 未来城市',
    summary:
      '用 Midjourney 生成的未来城市概念影像：体量感的天际线、湿润的霓虹反光与缓慢推进的镜头，一段就能感受到「AI 影像」当下的审美高度。',
    tags: ['Midjourney', 'AI 影像', '未来城市', '概念设计'],
    date: '2026-06-23',
    time: '17:10',
    src: feedMediaUrl('feed/midjourney-future-city.mp4'),
    aspect: '16/9',
    source: { label: 'Midjourney', href: 'https://www.midjourney.com/' },
  },
]

// ============================================================
// 工具函数
// ============================================================

/** 拼接可比较的排序键 'YYYY-MM-DD HH:mm' */
function feedSortKey(item) {
  return `${item.date || ''} ${item.time || '00:00'}`
}

/** 所有条目，按时间倒序（最新在前） */
export function getAllFeedItems() {
  return [...FEED_ITEMS].sort((a, b) => feedSortKey(b).localeCompare(feedSortKey(a)))
}

/** 取最新若干条（首页推荐位用） */
export function getLatestFeedItems(count = 1) {
  return getAllFeedItems().slice(0, Math.max(0, count))
}

/** 内容类型在列表里的出现顺序（用于筛选 chips） */
export function getFeedTypesPresent() {
  const present = new Set(FEED_ITEMS.map((i) => i.type))
  return Object.keys(FEED_TYPE_META).filter((t) => present.has(t))
}
