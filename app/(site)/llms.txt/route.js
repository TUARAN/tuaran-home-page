import { CATEGORY_META, listResearch } from '../../../lib/research/archive'
import { researchPublicSummary } from '../../../lib/research/researchPublicSummary'
import { renderContentProofLlmsSection } from '../../../lib/content/contentProofDiscovery.js'

export const dynamic = 'force-static'
export const revalidate = 3600

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const SITE_DESC =
  '涂阿燃（TUARAN，微信 atar24）：AI 智能体、前端工程与开源实践，著有《AI大模型的底层逻辑》《程序员成长手记》《AI Bots 通关指南》。' +
  '主理博主联盟与前端周看。市场、健康和其他观察仍可检索。'

function line(entry) {
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const desc = researchPublicSummary(entry)
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
    `- [站点帮助](${SITE_URL}/help): 站点定位、使用方法、全站导航、内容规则、隐私政策与联系方式`,
    `- [关于站长](${SITE_URL}/about): 涂阿燃，FDE / KOL / 矩联科技，微信 atar24`,
    `- [AI 智能体](${SITE_URL}/topics/ai-agents): 智能体实践、OpenClaw 与相关文章`,
    `- [前端与云工程](${SITE_URL}/topics/frontend-cloud): Next.js、Cloudflare 与站点工程`,
    `- [求职简历](${SITE_URL}/about/resume): 涂阿燃一页式求职履历，可打印或另存 PDF`,
    `- [工具与下载](${SITE_URL}/tools): 在线工具、浏览器扩展、桌面应用与开发实验`,
    `- [Codex 重置监控](${SITE_URL}/codex-reset): Tibo 公开的 Codex 额度重置、重置卡发放与原帖日历`,
    `- [产品集](${SITE_URL}/works): 2aran 的独立产品、站内工具与工程作品总览`,
    `- [Agent 能力集](${SITE_URL}/capabilities): Skill、MCP、Prompt 与 WorkBuddy 能力包的统一入口`,
    `- [服务](${SITE_URL}/services): 可提供的合作与服务`,
    `- [统一内容目录](${SITE_URL}/articles): 按内容主题和内容类型浏览`,
    `- [内容说明](${SITE_URL}/editorial): 作者、选题、核对、更正与 AI 协助；金融与健康内容不构成投资或医疗建议`,
    `- [RSS](${SITE_URL}/rss.xml): 订阅源`,
    `- [链上作品](${SITE_URL}/onchain-blog): 中国象棋等可直接使用并可核对发布记录的链上作品合集`,
    `- [CNT 白皮书](${SITE_URL}/onchain-blog/whitepaper): CNT 内容生态代币经济白皮书正式完整版`,
    `- [Agent 验证说明](${SITE_URL}/verify.txt): 内容凭证协议、信任边界与离线验证命令`,
    `- [内容凭证发现](${SITE_URL}/.well-known/content-proof.json): well-known 发现文档`,
    `- [内容凭证 RSS](${SITE_URL}/proofs.xml): 内容指纹、proof JSON 与副本入口`,
    '',
    renderContentProofLlmsSection(),
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
