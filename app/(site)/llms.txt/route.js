import { CATEGORY_META, listResearch } from '../../../lib/research/loader'

export const dynamic = 'force-static'
export const revalidate = 3600

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const SITE_DESC =
  '涂阿燃（安东尼）：前端与 AI 工程化 Agent 工程师；主理博主联盟与前端周看。' +
  '本站记录工程实践、技术情报与创作者增长，并维护一个个人内容、项目和资源门户。'

function line(entry) {
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const desc = entry.summary || entry.tldr || ''
  return desc ? `- [${entry.title}](${url}): ${desc}` : `- [${entry.title}](${url})`
}

export function GET() {
  const all = listResearch().filter((e) => !e.encrypted)
  const topics = all.filter((e) => e.category === 'topics')
  const companies = all.filter((e) => e.category === 'companies')

  const parts = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESC}`,
    '',
    '本文件遵循 llms.txt 约定，便于大语言模型与 AI 检索工具快速理解本站结构与可引用内容。',
    '内容作者统一署名 TUARAN，AI 仅作协助工具。',
    '',
    '## 主要页面',
    `- [首页](${SITE_URL}/): 个人主页与网络日志`,
    `- [关于本站](${SITE_URL}/site): 站点定位、参与方式、燃币与支持说明`,
    `- [关于站长](${SITE_URL}/about): 站长介绍与履历`,
    `- [服务](${SITE_URL}/services): 可提供的合作与服务`,
    `- [AI 项目](${SITE_URL}/works): 在做的产品与实验`,
    `- [知识库](${SITE_URL}/articles): 调研与文章总入口`,
    `- [RSS](${SITE_URL}/rss.xml): 订阅源`,
    '',
    `## ${CATEGORY_META.topics?.label || '事项调研'}`,
    ...(topics.length ? topics.map(line) : ['- （暂无）']),
    '',
    `## ${CATEGORY_META.companies?.label || '公司调研'}`,
    ...(companies.length ? companies.map(line) : ['- （暂无）']),
    '',
  ]

  return new Response(parts.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
