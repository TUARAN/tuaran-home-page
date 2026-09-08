import Link from 'next/link'

import AgentCenterHero from '../components/AgentCenterHero'
import PageContainer from '../components/PageContainer'
import { WORKBUDDY_MARKETPLACE_ARTIFACTS } from '../../../lib/workbuddyMarketplaceArtifacts'

export const dynamic = 'force-static'

export const metadata = {
  title: 'WorkBuddy 上架中心',
  description: '把 2aran.com 的 Skill、MCP 与 Prompt 整理为可验证、可打包、可提交审核的 WorkBuddy 生态资产。',
  keywords: ['WorkBuddy', '技能市场', 'Skill', 'MCP', '连接器', '专家', '上架流程'],
  alternates: { canonical: '/workbuddy-publish-center' },
}

const ASSETS = [
  {
    index: '01',
    kind: 'Skill',
    title: '大模型增效指令',
    readiness: '90%',
    state: '可先提交',
    tone: 'ready',
    description: '纯 SKILL.md 资产，无服务与 OAuth 依赖，适合先验证 WorkBuddy 技能市场的解析和审核流程。',
    missing: '发布者名称、联系邮箱、许可证',
    links: [
      { label: '查看 Skill', href: '/skill-center/llm-productivity-directives' },
      { label: '配套审查 Prompt', href: '/prompt-center#review' },
    ],
  },
  {
    index: '02',
    kind: 'MCP + Skill',
    title: '涂阿燃文章连接器',
    readiness: '80%',
    state: '待线上联调',
    tone: 'testing',
    description: '已有 HTTPS Streamable HTTP、OAuth 2.1、PKCE 和两个只读工具，可整理为 WorkBuddy 连接器包。',
    missing: 'WorkBuddy OAuth 实测、市场图标、支持信息',
    links: [
      { label: '查看文章 MCP', href: '/mcp-center#tuaran-articles' },
      { label: '搜索任务 Prompt', href: '/prompt-center#research' },
    ],
  },
  {
    index: '03',
    kind: 'Expert',
    title: '公开资料研究员',
    readiness: '40%',
    state: '待创建',
    tone: 'planned',
    description: '以研究方法为角色核心，组合站内调研 Skill、证据型 Prompt 和文章 MCP，形成可召唤的研究专家。',
    missing: '专家名称、头像、职业描述、Agent 定义',
    links: [
      { label: '关联调研 Skill', href: '/skill-center/rich-data-research-page' },
      { label: '关联研究 Prompt', href: '/prompt-center#research' },
      { label: '依赖文章 MCP', href: '/mcp-center#tuaran-articles' },
    ],
  },
]

const FLOW = [
  ['01', '选择资产', '确认交付物属于 Skill、连接器或专家，避免用错误入口换取权限。'],
  ['02', '补齐元信息', '统一名称、版本、作者、中英文介绍、许可证和支持入口。'],
  ['03', '生成审核包', '按官方目录契约生成 ZIP，保持根目录干净，引用路径可以解析。'],
  ['04', '自动预检', '检查必填字段、敏感凭据、绝对路径、文件大小和版本一致性。'],
  ['05', '真实联调', '用代表性提示词验证安装、触发、工具选择、OAuth 和错误恢复。'],
  ['06', '提交审核', '在对应市场入口上传；记录提交版本、时间、反馈和修改原因。'],
  ['07', '回写站内', '审核通过后补市场链接和版本；驳回则修正同一资产，不复制新入口。'],
]

const MATERIALS = [
  {
    title: '首个包必须提供',
    state: '等待确认',
    items: ['开放平台登记的发布者名称', '对外联系邮箱', '首发资产选择', '默认许可证'],
  },
  {
    title: '连接器上线前',
    state: '部分具备',
    items: ['64×64 以上清晰图标', '正式 HTTPS MCP 地址', 'OAuth / Token 鉴权方式', '支持文档与故障恢复说明'],
  },
  {
    title: '专家上线前',
    state: '待准备',
    items: ['512×512 专家头像，≤500KB', '中英文展示名与职业', '40～50 字中文市场描述', '固定 3 个标签与 3 条快捷提示'],
  },
]

const PACKAGE_ROWS = [
  ['Skill', 'SKILL.md', 'references/ · scripts/ · templates/', '大模型增效指令'],
  ['连接器', 'connector-meta.json · mcp.json · icon.svg', 'skills/', '涂阿燃文章 MCP'],
  ['专家', '.codebuddy-plugin/plugin.json · agents/*.md · avatars/*', 'skills/ · .mcp.json', '公开资料研究员'],
]

const DOCS = [
  { label: '技能市场规范', href: 'https://open.workbuddy.cn/docs/skill', note: 'SKILL.md、参考资料、脚本与模板目录' },
  { label: '连接器规范', href: 'https://open.workbuddy.cn/docs/connector', note: 'MCP + Skill、CLI + Skill、OAuth 与 Token' },
  { label: '专家规范', href: 'https://open.workbuddy.cn/docs/expert', note: '插件配置、Agent、头像、标签与依赖' },
]

function Pill({ children, tone = 'neutral' }) {
  const colors = {
    ready: 'bg-[#e7eee2] text-[#47613d] dark:bg-[#18291e] dark:text-[#b8d2ad]',
    testing: 'bg-[#eee8d9] text-[#765825] dark:bg-[#2a2415] dark:text-[#ddc487]',
    planned: 'bg-[#e7e8e8] text-[#626665] dark:bg-[#1c242a] dark:text-[#bdc8ce]',
    neutral: 'bg-[#eceae2] text-[#666653] dark:bg-[#17212d] dark:text-[#c9d6e5]',
  }
  return <span className={`inline-flex rounded-sm px-2 py-0.5 font-mono text-[10px] leading-5 ${colors[tone]}`}>{children}</span>
}

function TextLink({ href, children, external = false }) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="inline-flex items-center gap-1 text-xs font-medium text-[#80521b] no-underline underline-offset-4 hover:underline dark:text-[#b9c57f]"
    >
      {children} {external ? '↗' : '→'}
    </Link>
  )
}

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

const PACKAGE_GROUPS = [
  ['Skill', '技能审核包', '每个 ZIP 以技能目录为根，包含 WorkBuddy 必填 frontmatter 和实际引用资源。'],
  ['MCP', '连接器审核包', '每个 ZIP 只配置一个 MCP Server，包含双语元信息、调用说明和市场图标。'],
]

export default function WorkBuddyPublishCenterPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <AgentCenterHero
        current="/workbuddy-publish-center"
        eyebrow="WorkBuddy 上架中心"
        title="从站内资产到生态市场"
        description="统一记录 Skill、MCP、Prompt 与专家之间的依赖关系，把内容整理、技术验证、审核材料和版本回写收进一条可重复的上架流程。"
        shareText="2aran.com 的 WorkBuddy 生态资产、上架流程与准备状态。"
      />

      <section aria-labelledby="release-overview" className="border-y border-[#cfcfc5] dark:border-[#2b3745]">
        <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
          <header className="border-b border-[#d9d9cf] py-7 pr-6 dark:border-[#283443] lg:border-b-0 lg:border-r">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b5a1f] dark:text-[#a1ab76]">Release desk · 2026.09</p>
            <h2 id="release-overview" className="mb-3 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100 md:text-3xl">首发队列</h2>
            <p className="mb-0 max-w-md text-sm leading-7 text-[#505148] dark:text-gray-300">先用一个轻量 Skill 跑通审核，再提交需要 OAuth 联调的文章连接器，最后让专家组合前两类能力。</p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#dedfd5] pt-4 dark:border-[#283443]">
              {[['3', '候选资产'], ['8', '站内 Skill'], ['2', '正式工具']].map(([value, label]) => (
                <div key={label}>
                  <strong className="block font-serif text-2xl font-semibold text-[#28291f] dark:text-gray-100">{value}</strong>
                  <span className="text-[10px] text-[#6e7064] dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </header>

          <div className="divide-y divide-[#d9d9cf] dark:divide-[#283443] lg:pl-7">
            {ASSETS.map((asset) => (
              <article key={asset.title} className="grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start">
                <span className="font-mono text-xs tracking-[0.12em] text-[#9a815e] dark:text-[#8d9873]">{asset.index}</span>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">{asset.title}</h3>
                    <Pill>{asset.kind}</Pill>
                    <Pill tone={asset.tone}>{asset.state}</Pill>
                  </div>
                  <p className="mb-2 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{asset.description}</p>
                  <p className="mb-3 text-xs leading-5 text-[#74766c] dark:text-gray-400"><span className="font-medium text-[#4d4e45] dark:text-gray-300">仍需：</span>{asset.missing}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {asset.links.map((link) => <TextLink key={link.href + link.label} href={link.href}>{link.label}</TextLink>)}
                  </div>
                </div>
                <div className="min-w-20 sm:text-right">
                  <span className="block font-serif text-3xl font-semibold text-[#303126] dark:text-gray-100">{asset.readiness}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#898a80] dark:text-gray-500">readiness</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="relationship-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Asset relationship</p>
            <h2 id="relationship-title" className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">一套能力，四个入口</h2>
          </div>
          <p className="mb-0 max-w-xl text-xs leading-5 text-[#66685f] dark:text-gray-400">Prompt 提供单次任务入口，Skill 固化方法，MCP 提供数据，专家负责组合和判断。</p>
        </div>
        <div className="grid border border-[#d6d6cc] bg-[#f6f5f0] dark:border-[#283443] dark:bg-[#0f1720] md:grid-cols-4">
          {[
            ['Prompt', '怎么说', '定义研究问题与验收标准', '/prompt-center#research'],
            ['Skill', '怎么做', '执行证据调研与页面交付', '/skill-center/rich-data-research-page'],
            ['MCP', '连什么', '查询 2aran.com 公开内容', '/mcp-center#tuaran-articles'],
            ['Expert', '谁来做', '组合方法、数据与判断', '#release-overview'],
          ].map(([name, question, desc, href], index) => (
            <Link key={name} href={href} className="group relative min-h-40 border-b border-[#d6d6cc] p-5 text-[#27291f] no-underline hover:bg-white hover:!no-underline dark:border-[#283443] dark:text-gray-100 dark:hover:bg-[#141f2a] md:border-b-0 md:border-r last:md:border-r-0">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#8b5a1f] dark:text-[#a1ab76]">0{index + 1} · {question}</span>
              <h3 className="mb-2 mt-5 border-b-0 pb-0 font-serif text-xl font-semibold">{name}</h3>
              <p className="mb-0 text-xs leading-5 text-[#62645b] dark:text-gray-400">{desc}</p>
              <span className="absolute bottom-4 right-5 text-sm text-[#9b8059] transition-transform group-hover:translate-x-1 dark:text-[#89956e]">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="downloads-title">
        <div className="mb-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Upload-ready archives</p>
            <h2 id="downloads-title" className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">WorkBuddy ZIP 下载</h2>
          </div>
          <p className="mb-0 text-xs leading-5 text-[#66685f] dark:text-gray-400">共 {WORKBUDDY_MARKETPLACE_ARTIFACTS.length} 个独立包，均低于平台 3MB 限制并通过目录、敏感文件和绝对路径预检。状态说明的是“是否适合提交审核”，不影响下载。</p>
        </div>

        <div className="space-y-7">
          {PACKAGE_GROUPS.map(([kind, title, description]) => {
            const packages = WORKBUDDY_MARKETPLACE_ARTIFACTS.filter((artifact) => artifact.kind === kind)
            return (
              <section key={kind} aria-labelledby={`package-${kind.toLowerCase()}`} className="overflow-hidden border border-[#d2d2c8] dark:border-[#283443]">
                <header className="grid gap-3 border-b border-[#d2d2c8] bg-[#efede5] px-5 py-4 dark:border-[#283443] dark:bg-[#111a24] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <h3 id={`package-${kind.toLowerCase()}`} className="mb-1 border-b-0 pb-0 font-serif text-xl font-semibold text-[#202219] dark:text-gray-100">{title}</h3>
                    <p className="mb-0 text-xs leading-5 text-[#5f6158] dark:text-gray-400">{description}</p>
                  </div>
                  <Pill>{packages.length} 个 ZIP</Pill>
                </header>
                <div className="divide-y divide-[#deded5] dark:divide-[#283443]">
                  {packages.map((artifact, index) => (
                    <article key={artifact.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-[#faf9f5] dark:hover:bg-[#101923] lg:grid-cols-[2.5rem_minmax(13rem,0.8fr)_minmax(16rem,1.2fr)_auto] lg:items-center">
                      <span className="font-mono text-[10px] tracking-[0.12em] text-[#9a815e] dark:text-[#8d9873]">{String(index + 1).padStart(2, '0')}</span>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="mb-0 border-b-0 pb-0 text-sm font-semibold text-[#25271f] dark:text-gray-100">{artifact.title}</h4>
                          <Pill tone={artifact.readiness === 'ready' ? 'ready' : artifact.readiness === 'test-only' ? 'planned' : 'testing'}>{artifact.readinessLabel}</Pill>
                        </div>
                        <p className="mb-0 break-all font-mono text-[10px] leading-5 text-[#77796f] dark:text-gray-500">{artifact.id}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-5 text-[#56584f] dark:text-gray-300">{artifact.note}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#85877c] dark:text-gray-500">
                          <span>{formatBytes(artifact.bytes)}</span>
                          <span title={artifact.sha256}>SHA-256 {artifact.sha256.slice(0, 10)}…</span>
                          <Link href={artifact.sourceUrl} className="text-[#80521b] no-underline hover:underline dark:text-[#b9c57f]">关联来源 →</Link>
                        </div>
                      </div>
                      <a href={artifact.downloadUrl} download className="inline-flex min-h-10 items-center justify-center border border-[#44463d] px-4 text-xs font-semibold text-[#2d2f27] no-underline transition-colors hover:bg-[#2d2f27] hover:text-white hover:!no-underline dark:border-[#7e8a91] dark:text-gray-100 dark:hover:bg-gray-100 dark:hover:text-[#10161d]">下载 ZIP ↓</a>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-4 grid gap-px bg-[#d9d9cf] dark:bg-[#283443] sm:grid-cols-3">
          {[
            ['3MB', '单包上限', `当前最大包 ${formatBytes(Math.max(...WORKBUDDY_MARKETPLACE_ARTIFACTS.map((artifact) => artifact.bytes)))}`],
            ['11 / 11', '结构预检', '根目录与必填文件完整'],
            ['0', '打包凭据', '无 Token、Secret 与 .env'],
          ].map(([value, label, note]) => (
            <div key={label} className="bg-[#f6f5f0] px-5 py-4 dark:bg-[#0f1720]">
              <strong className="block font-serif text-xl font-semibold text-[#28291f] dark:text-gray-100">{value}</strong>
              <span className="mt-1 block text-xs font-medium text-[#4e5047] dark:text-gray-300">{label}</span>
              <span className="mt-1 block text-[10px] text-[#77796f] dark:text-gray-500">{note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]" aria-labelledby="workflow-title">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Standard operating procedure</p>
          <h2 id="workflow-title" className="mb-5 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">标准上架流程</h2>
          <ol className="border-t border-[#d7d7cd] dark:border-[#283443]">
            {FLOW.map(([number, title, desc]) => (
              <li key={number} className="grid grid-cols-[2.75rem_7rem_minmax(0,1fr)] gap-3 border-b border-[#d7d7cd] py-4 dark:border-[#283443] sm:grid-cols-[3.5rem_9rem_minmax(0,1fr)]">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[#9a815e] dark:text-[#8d9873]">{number}</span>
                <strong className="text-sm font-semibold text-[#292b22] dark:text-gray-100">{title}</strong>
                <span className="text-xs leading-5 text-[#5d5f56] dark:text-gray-400">{desc}</span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="self-start border border-[#cfcfc5] bg-[#efede5] p-5 dark:border-[#283443] dark:bg-[#111a24] sm:p-6">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Package contract</p>
          <h2 className="mb-4 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">审核包结构</h2>
          <div className="space-y-4">
            {PACKAGE_ROWS.map(([kind, required, optional, example]) => (
              <article key={kind} className="border-t border-[#d5d3c9] pt-3 dark:border-[#2a3644]">
                <div className="mb-2 flex items-center justify-between gap-3"><strong className="text-sm text-[#292b22] dark:text-gray-100">{kind}</strong><Pill>{example}</Pill></div>
                <p className="mb-1 break-words font-mono text-[10px] leading-5 text-[#4f5148] dark:text-gray-300">{required}</p>
                <p className="mb-0 text-[10px] leading-5 text-[#77796f] dark:text-gray-500">可选：{optional}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 border-t border-[#d5d3c9] pt-4 dark:border-[#2a3644]">
            <p className="mb-0 text-xs leading-6 text-[#55574e] dark:text-gray-300">生成物统一经过字段、路径、凭据与文件大小检查，再进入真实安装测试。密钥、Token 和本机绝对路径不得进入审核包。</p>
          </div>
        </aside>
      </section>

      <section className="mt-10" aria-labelledby="materials-title">
        <div className="mb-5">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Submission inputs</p>
          <h2 id="materials-title" className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">需要准备的材料</h2>
        </div>
        <div className="grid gap-px overflow-hidden border border-[#d5d5cb] bg-[#d5d5cb] dark:border-[#283443] dark:bg-[#283443] md:grid-cols-3">
          {MATERIALS.map((group) => (
            <article key={group.title} className="bg-white p-5 dark:bg-[#0f1720]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="mb-0 border-b-0 pb-0 font-serif text-lg font-semibold text-[#202219] dark:text-gray-100">{group.title}</h3>
                <Pill>{group.state}</Pill>
              </div>
              <ul className="mb-0 space-y-2">
                {group.items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#55574e] dark:text-gray-300"><span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#a1845b] dark:bg-[#96a276]" />{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-2 mt-10 border-t border-[#d2d3c8] pt-6 dark:border-[#283443]" aria-labelledby="docs-title">
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">Official references</p>
            <h2 id="docs-title" className="mb-2 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">官方规范入口</h2>
            <p className="mb-0 text-xs leading-5 text-[#66685f] dark:text-gray-400">提交前以 WorkBuddy 当前文档为准；平台字段变化时先更新校验规则。</p>
          </div>
          <div className="grid gap-x-6 sm:grid-cols-3">
            {DOCS.map((doc) => (
              <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer" className="group border-t border-[#d8d8ce] py-3 text-[#34362e] no-underline hover:!no-underline dark:border-[#283443] dark:text-gray-200">
                <span className="block text-sm font-semibold group-hover:text-[#80521b] dark:group-hover:text-[#b9c57f]">{doc.label} ↗</span>
                <span className="mt-1 block text-[11px] leading-5 text-[#6a6c62] dark:text-gray-400">{doc.note}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
