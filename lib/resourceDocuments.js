import fs from 'fs'
import path from 'path'

/** 站内长文资料元数据，供资源页与知识库索引共用。 */
export const RESOURCE_DOCUMENTS = {
  'shen-zhi-ding-nei': {
    slug: 'shen-zhi-ding-nei',
    title: '置身钉内',
    pageTitle: '置身钉内全文原文：钉钉 ONE 项目离职复盘长文',
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
    tags: ['置身钉内', '钉钉', '职场', '组织观察', 'B端产品', '原文存档'],
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
