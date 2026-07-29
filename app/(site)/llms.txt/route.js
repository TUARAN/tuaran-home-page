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
    'llms.txt 目录便于大语言模型与 AI 检索工具快速理解站点结构与可引用内容。',
    '内容由 TUARAN 选题、判断、编排并承担最终责任；工具只用于资料整理、校对或表达辅助。',
    '',
    '## 主要页面',
    `- [首页](${SITE_URL}/): 个人主页与网络日志`,
    `- [关于本站](${SITE_URL}/site): 站点定位、参与方式、燃币与支持说明`,
    `- [关于站长](${SITE_URL}/about): 站长介绍与履历`,
    `- [服务](${SITE_URL}/services): 可提供的合作与服务`,
    `- [AI 项目](${SITE_URL}/works): 在做的产品与实验`,
    `- [Skill 中心](${SITE_URL}/skill-center): 面向智能体的可复用能力、工作流与安装说明`,
    `- [MCP 中心](${SITE_URL}/mcp-center): 可供智能体连接的公开服务与配置说明`,
    `- [Prompt 中心](${SITE_URL}/prompt-center): 面向智能体的提示词经验、任务模板与工程参考`,
    `- [文章与分析](${SITE_URL}/articles): 原创文章、实践复盘与专题分析入口`,
    `- [内容说明](${SITE_URL}/editorial): 作者责任、工具使用与更正机制`,
    `- [RSS](${SITE_URL}/rss.xml): 订阅源`,
    '',
    `## ${CATEGORY_META.topics?.label || '专题'}`,
    ...(topics.length ? topics.map(line) : ['- （暂无）']),
    '',
    `## ${CATEGORY_META.companies?.label || '公司观察'}`,
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
