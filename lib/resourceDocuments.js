import fs from 'fs'
import path from 'path'

/** 站内长文资料元数据，供资源页与知识库索引共用。 */
export const RESOURCE_DOCUMENTS = {
  'shen-zhi-ding-nei': {
    slug: 'shen-zhi-ding-nei',
    title: '《置身钉内》',
    pageTitle: '《置身钉内》全文原文：钉钉 ONE 项目离职复盘长文',
    subtitle: '滕雅辛（幽素）· 2026 年 6 月 · 约 7.5 万字',
    date: '2026-06-05',
    author: '滕雅辛（幽素）',
    wordCount: '约 7.5 万字',
    markdownFile: 'content/resources/shen-zhi-ding-nei.md',
    gistUrl: 'https://gist.github.com/horaceho/4be04df73b1f1ede458ad5cec2b94132',
    gistRawUrl:
      'https://gist.githubusercontent.com/horaceho/4be04df73b1f1ede458ad5cec2b94132/raw/%E7%BD%AE%E8%BA%AB%E9%92%89%E5%86%85.md',
    researchHref: '/articles/research/topics/shen-zhi-ding-nei-workplace-observation',
    summary:
      '2026 年 6 月阿里内网流传的《置身钉内》：钉钉 AI 产品经理以 ONE 项目八卷结构，记录 AI 办公产品从立项、冲高到收缩的全过程，并延伸到已读压力、组织节奏与职场权力结构。',
    tags: ['《置身钉内》', '钉钉', '职场', '组织观察', 'B端产品', '原文存档'],
  },
  'shen-zhi-ding-wai': {
    slug: 'shen-zhi-ding-wai',
    title: '《置身钉外》',
    pageTitle: '《置身钉外》全文原文：钉钉副总裁马锐拉离职回应长文',
    subtitle: '马锐拉 · 2026 年 6 月 · 公开版约 2600 字（自述原稿近两万字）',
    date: '2026-06-08',
    author: '马锐拉',
    wordCount: '约 2600 字',
    markdownFile: 'content/resources/shen-zhi-ding-wai.md',
    sourceLabel: '马锐拉个人公众号（媒体转载）',
    sourceUrl: 'https://finance.sina.com.cn/tech/roll/2026-06-09/doc-iniaukpc1974557.shtml',
    researchHref: '/articles/research/topics/shen-zhi-ding-nei-workplace-observation',
    summary:
      '《置身钉内》在阿里内外刷屏后，已于 2026 年 5 月 15 日办完离职手续的钉钉副总裁马锐拉在个人公众号发布《置身钉外》：从管理者一侧回应高压节奏、长期熬夜与「不能说」的复杂感受，并表达对钉钉的祝福。',
    tags: ['《置身钉外》', '钉钉', '职场', '组织观察', '离职长文', '原文存档'],
  },
  'shen-zhi-tuan-nei': {
    slug: 'shen-zhi-tuan-nei',
    title: '《置身团内》',
    pageTitle: '《置身团内》文字版全文：美团到餐基层产品长文存档',
    subtitle: '美团到餐基层产品员工 · 2026 年 6 月 · 约 2200 字',
    date: '2026-06-23',
    author: '美团到餐基层产品员工（脉脉匿名）',
    wordCount: '约 2200 字',
    markdownFile: 'content/resources/shen-zhi-tuan-nei.md',
    sourceLabel: '新浪科技 / 快科技转载页',
    sourceUrl: 'https://finance.sina.com.cn/tech/discovery/2026-06-23/doc-iniekeev9770960.shtml',
    researchHref: '/articles/research/topics/shen-zhi-tuan-nei-meituan-workplace-observation',
    summary:
      '2026 年 6 月 23 日，一名自称美团到餐基层产品员工在脉脉发布《置身团内》：谈美团组织路径依赖、本地生活数据资产化与 AI 落地问题。',
    tags: ['《置身团内》', '美团', '美团到餐', '职场', '组织观察', '原文存档'],
  },
  'shen-zhi-mi-nei': {
    slug: 'shen-zhi-mi-nei',
    title: '《置身米内》',
    pageTitle: '《置身米内》：小米校招员工长文（内网飞书文档已删除）',
    subtitle: '小米校招员工（内网匿名）· 2026 年 6 月 · 约 4000 字',
    date: '2026-06-24',
    author: '小米校招员工（内网匿名）',
    wordCount: '约 4000 字',
    // 原文为内网飞书文档且已被删除，无可核验公开全文，本站不做全文存档
    markdownFile: null,
    sourceLabel: '网易 / DoNews 等媒体转述',
    sourceUrl: 'https://www.163.com/dy/article/L07A6RT10519U3I5.html',
    researchHref: '/articles/research/topics/shen-zhi-mi-nei-xiaomi-workplace-observation',
    summary:
      '2026 年 6 月 24 日前后，一名自称小米校招员工在内网飞书文档发布《置身米内》：把雷军类比项羽，谈小米高端化、创始人依赖与校招人才流失。原文已删除，外部只剩媒体转述摘录。',
    tags: ['《置身米内》', '小米', '雷军', '职场', '组织观察', '创始人依赖'],
  },
}

export function getResourceDocument(slug) {
  return RESOURCE_DOCUMENTS[slug] || null
}

export function loadResourceMarkdown(slug) {
  const doc = getResourceDocument(slug)
  if (!doc?.markdownFile) return ''
  const filePath = path.join(process.cwd(), doc.markdownFile)
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}
