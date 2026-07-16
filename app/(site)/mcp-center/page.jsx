import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import McpConfigActions from './McpConfigActions'

export const dynamic = 'force-static'

export const metadata = {
  title: 'MCP 中心',
  description: '面向 AI 智能体的 MCP 服务中心：连接涂阿燃的公开文章、专题调研与资源索引。',
  keywords: ['MCP', 'Model Context Protocol', 'AI Agent', '智能体', '文章接口', '涂阿燃'],
  alternates: { canonical: '/mcp-center' },
}

const ENDPOINT = 'https://2aran.com/api/mcp/articles'
const JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-articles': { url: ENDPOINT },
  },
}, null, 2)

const CODEX_CONFIG = `[mcp_servers.tuaran-articles]\nurl = "${ENDPOINT}"`

const SECURITY_ITEMS = [
  ['只读最小权限', '仅提供公开文章元数据查询；不暴露正文草稿、后台数据、用户信息和任何写操作。'],
  ['协议与输入校验', '校验 JSON-RPC、MCP 版本、Content-Type、请求体大小、工具名和参数范围。'],
  ['OAuth 授权', '使用本站账号登录和同意页，授权码通过 PKCE 换取绑定到文章 MCP audience 的短期 Token。'],
  ['滥用控制', '按 IP 做分钟与每日限流；线上建议再叠加 Cloudflare WAF Rate Limiting。'],
]

function Pill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#cccdc2] bg-[#eaebe3] px-2.5 py-1 text-xs text-[#555640] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

export default function McpCenterPage() {
  return (
    <PageContainer className="py-10">
      <header className="mb-8 border-b border-[#dee0db] pb-6 dark:border-[#202938]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#626358] dark:text-gray-400">
              <Link href="/works" className="underline-offset-4 hover:underline">AI 项目</Link>
              <span>/</span>
              <span>MCP 中心</span>
            </div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">MCP Hub</p>
            <h1 className="mb-4 font-serif text-3xl font-semibold tracking-normal text-[#191915] dark:text-gray-100 md:text-5xl">
              把内容接入智能体的服务货架
            </h1>
            <p className="mb-0 max-w-3xl text-base leading-8 text-[#43433b] dark:text-gray-300">
              Skill 告诉智能体“怎么做”，MCP 让智能体“能连接什么”。在支持远程 MCP 的客户端中添加服务后，就可以直接询问我最近更新了哪些文章，或按主题检索公开内容。
            </p>
          </div>
          <SharePageButton title="MCP 中心" text="面向 AI 智能体的 MCP 服务中心。" url="/mcp-center" />
        </div>
      </header>

      <section className="rounded-lg border border-[#d2d3c8] bg-white dark:border-[#283443] dark:bg-[#101820]">
        <header className="border-b border-[#dedfd5] p-5 dark:border-[#263241]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 font-mono text-xs text-[#8b5a1f] dark:text-[#a1ab76]">tuaran-articles</p>
              <h2 className="mb-2 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">涂阿燃文章 MCP</h2>
              <div className="flex flex-wrap gap-1.5">
                <Pill>已上架</Pill><Pill>Streamable HTTP</Pill><Pill>OAuth 2.1</Pill><Pill>公开只读</Pill>
              </div>
            </div>
            <McpConfigActions config={JSON_CONFIG} />
          </div>
          <p className="mb-0 mt-4 max-w-3xl text-sm leading-7 text-[#4c4c44] dark:text-gray-300">
            查询本站公开文章、专题调研和资源。首次连接会跳转到本站登录与授权页；确认后提供 <code>get_recent_articles</code> 与 <code>search_articles</code> 两个只读工具。
          </p>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">通用客户端配置</p>
            <pre className="overflow-x-auto rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-4 font-mono text-xs leading-6 text-[#33352d] dark:border-[#263241] dark:bg-[#0d151e] dark:text-gray-300"><code>{JSON_CONFIG}</code></pre>
            <p className="mt-3 text-xs leading-6 text-[#56564d] dark:text-gray-300">
              对应截图中的 <code>mcpServers</code> 配置区。不同客户端字段名可能略有差异，核心都是把远程 URL 指向上面的端点。
            </p>
          </section>
          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">Codex config.toml</p>
            <pre className="overflow-x-auto rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-4 font-mono text-xs leading-6 text-[#33352d] dark:border-[#263241] dark:bg-[#0d151e] dark:text-gray-300"><code>{CODEX_CONFIG}</code></pre>
            <div className="mt-4 rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-4 dark:border-[#263241] dark:bg-[#121a24]">
              <p className="mb-1 text-xs text-[#6e7064] dark:text-gray-400">可以这样问</p>
              <p className="mb-0 text-sm leading-7 text-[#34362e] dark:text-gray-200">“调用 tuaran-articles，告诉我涂阿燃最近更新了哪些 AI Agent 相关文章。”</p>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-[#d2d3c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <p className="mb-1 text-xs text-[#6e7064] dark:text-gray-400">Security Boundary</p>
        <h2 className="mb-4 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">接口开放，但能力边界必须收紧</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SECURITY_ITEMS.map(([title, desc]) => (
            <article key={title} className="rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-4 dark:border-[#263241] dark:bg-[#121a24]">
              <h3 className="mb-2 border-b-0 pb-0 text-base font-semibold text-[#25271f] dark:text-gray-100">{title}</h3>
              <p className="mb-0 text-sm leading-7 text-[#4c4c44] dark:text-gray-300">{desc}</p>
            </article>
          ))}
        </div>
        <p className="mb-0 mt-4 text-sm leading-7 text-[#4c4c44] dark:text-gray-300">
          站点登录会话、OAuth 授权服务与 MCP Resource Server 分开运行：Cookie 只用于确认用户身份，MCP 只接受面向自身 audience、包含 <code>articles:read</code> scope 的短期 Access Token。若未来接入付费内容或写操作，将继续拆分独立 scope 和服务。
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['1', '添加服务', '复制配置，客户端发现受保护资源和本站授权中心。'],
          ['2', '登录并授权', '浏览器打开本站登录与同意页，通过 PKCE 建立用户委托。'],
          ['3', '按需查询', '智能体携带短期 Token 调用，只返回授权范围内的公开元数据。'],
        ].map(([number, title, desc]) => (
          <article key={number} className="rounded-lg border border-[#d2d3c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]">
            <span className="font-mono text-xs text-[#8b5a1f] dark:text-[#a1ab76]">STEP {number}</span>
            <h2 className="mb-2 mt-2 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">{title}</h2>
            <p className="mb-0 text-sm leading-7 text-[#4c4c44] dark:text-gray-300">{desc}</p>
          </article>
        ))}
      </section>
    </PageContainer>
  )
}
