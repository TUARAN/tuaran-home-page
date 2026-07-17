import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import McpConfigActions from './McpConfigActions'

export const dynamic = 'force-static'

export const metadata = {
  title: 'MCP 中心',
  description: '面向 AI 智能体的 MCP 服务中心：连接 HTTPS/OAuth 服务，或用本地 stdio Demo 联调 WorkBuddy。',
  keywords: ['MCP', 'Model Context Protocol', 'AI Agent', '智能体', '文章接口', '涂阿燃'],
  alternates: { canonical: '/mcp-center' },
}

const ENDPOINT = 'https://2aran.com/api/mcp/articles'
const WEATHER_ENDPOINT = 'https://2aran.com/api/mcp/weather'
const JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-articles': { url: ENDPOINT },
  },
}, null, 2)
const CODEX_CONFIG = `[mcp_servers.tuaran-articles]\nurl = "${ENDPOINT}"`
const WEATHER_JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-weather-test': { url: WEATHER_ENDPOINT },
  },
}, null, 2)
const WEATHER_CODEX_CONFIG = `[mcp_servers.tuaran-weather-test]\nurl = "${WEATHER_ENDPOINT}"`
const LOCAL_SERVER_PATH = '/ABSOLUTE/PATH/TO/tuaran-home-page/tools/mcp-stdio-demo/server.mjs'
const LOCAL_SECRET_PATH = '/ABSOLUTE/PATH/TO/crypto-demo.key'
const LOCAL_STDIO_JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-local-crypto-demo': {
      type: 'stdio',
      command: 'node',
      args: [LOCAL_SERVER_PATH],
      env: { LOCAL_MCP_SECRET_FILE: LOCAL_SECRET_PATH },
      description: '本地 AES-256-GCM 加解密联调 Demo',
    },
  },
}, null, 2)
const LOCAL_STDIO_CODEX_CONFIG = `[mcp_servers.tuaran-local-crypto-demo]\ncommand = "node"\nargs = ["${LOCAL_SERVER_PATH}"]\nenv = { LOCAL_MCP_SECRET_FILE = "${LOCAL_SECRET_PATH}" }`

const SERVICES = [
  {
    name: 'tuaran-articles',
    title: '涂阿燃文章 MCP',
    transport: 'Streamable HTTP',
    endpoint: ENDPOINT,
    tags: ['已上架', 'OAuth 2.1', '公开只读'],
    desc: '查询本站公开文章、专题调研和资源。首次连接会跳转登录与授权页。',
    tools: ['get_recent_articles', 'search_articles'],
    config: JSON_CONFIG,
    codexConfig: CODEX_CONFIG,
    prompt: '“调用 tuaran-articles，告诉我涂阿燃最近更新了哪些 AI Agent 相关文章。”',
  },
  {
    name: 'tuaran-weather-test',
    title: '天气查询测试 MCP',
    transport: 'Streamable HTTP',
    endpoint: WEATHER_ENDPOINT,
    tags: ['测试服务', '无需登录', '公开只读'],
    desc: '快速验证客户端连接和工具调用，支持按中英文城市名查询 Open-Meteo 天气。',
    tools: ['get_current_weather', 'get_weather_forecast'],
    config: WEATHER_JSON_CONFIG,
    codexConfig: WEATHER_CODEX_CONFIG,
    prompt: '“调用 tuaran-weather-test，查询广州现在的天气和未来三天预报。”',
  },
  {
    name: 'tuaran-local-crypto-demo',
    title: '本地加解密 MCP Demo',
    transport: 'stdio · 本地子进程',
    endpoint: 'node <server.mjs>  ↔  stdin / stdout',
    tags: ['联调 Demo', '无网络端口', '本地密钥'],
    desc: '由 WorkBuddy 在用户电脑上拉起 Node.js 进程，在本地执行 AES-256-GCM 加解密，用于验证 stdio 握手和工具调用。',
    tools: ['local_runtime_info', 'local_encrypt_text', 'local_decrypt_text'],
    config: LOCAL_STDIO_JSON_CONFIG,
    codexConfig: LOCAL_STDIO_CODEX_CONFIG,
    prompt: '“调用 tuaran-local-crypto-demo，先查看本地运行信息，再加密一段测试文本。”',
    guide: true,
  },
]

const SECURITY_ITEMS = [
  ['能力最小化', '远程服务仅读公开数据；本地 Demo 不读任意文件、不执行 shell。'],
  ['协议与输入校验', '校验 JSON-RPC、MCP 版本、请求体大小、工具名和参数范围。'],
  ['按服务区分授权', '文章 MCP 使用 OAuth 与 PKCE；天气测试 MCP 无需登录。'],
  ['滥用控制', '按 IP 做分钟与每日限流，线上叠加 Cloudflare WAF。'],
]

function Pill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#cccdc2] bg-[#eaebe3] px-2 py-0.5 text-[11px] leading-5 text-[#555640] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

function McpServiceCard({ service }) {
  return (
    <article className="min-w-0 rounded-lg border border-[#d2d3c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]">
      <header className="border-b border-[#dedfd5] pb-3 dark:border-[#263241]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 truncate font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{service.name}</p>
            <h2 className="mb-1.5 border-b-0 pb-0 font-serif text-xl font-semibold leading-tight text-[#1c1d18] dark:text-gray-100">{service.title}</h2>
            <div className="flex flex-wrap gap-1">
              <Pill>{service.transport}</Pill>
              {service.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
            </div>
          </div>
          <McpConfigActions config={service.config} />
        </div>
        <p className="mb-0 mt-2.5 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{service.desc}</p>
      </header>

      <dl className="grid gap-2 border-b border-[#dedfd5] py-3 text-xs dark:border-[#263241]">
        <div className="grid min-w-0 grid-cols-[4.5rem_1fr] gap-2">
          <dt className="text-[#6e7064] dark:text-gray-400">{service.transport.startsWith('stdio') ? '启动方式' : '端点'}</dt>
          <dd className="mb-0 truncate font-mono text-[11px] text-[#34362e] dark:text-gray-200" title={service.endpoint}>{service.endpoint}</dd>
        </div>
        <div className="grid min-w-0 grid-cols-[4.5rem_1fr] gap-2">
          <dt className="text-[#6e7064] dark:text-gray-400">工具</dt>
          <dd className="mb-0 flex min-w-0 flex-wrap gap-1">
            {service.tools.map((tool) => (
              <code key={tool} className="rounded bg-[#eaebe3] px-1.5 py-0.5 font-mono text-[10px] text-[#555640] dark:bg-[#17212d] dark:text-gray-300">{tool}</code>
            ))}
          </dd>
        </div>
      </dl>

      <details className="group border-b border-[#dedfd5] dark:border-[#263241]">
        <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-xs font-medium text-[#4c4c44] marker:hidden dark:text-gray-300">
          <span>查看客户端配置</span>
          <span className="text-[#8b5a1f] transition-transform group-open:rotate-90 dark:text-[#a1ab76]">→</span>
        </summary>
        <div className="grid gap-2 pb-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[#6e7064] dark:text-gray-400">通用 JSON</p>
            <pre className="overflow-x-auto rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-2.5 font-mono text-[10px] leading-5 text-[#33352d] dark:border-[#263241] dark:bg-[#0d151e] dark:text-gray-300"><code>{service.config}</code></pre>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[#6e7064] dark:text-gray-400">Codex TOML</p>
            <pre className="overflow-x-auto rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-2.5 font-mono text-[10px] leading-5 text-[#33352d] dark:border-[#263241] dark:bg-[#0d151e] dark:text-gray-300"><code>{service.codexConfig}</code></pre>
          </div>
        </div>
      </details>

      <div className="pt-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[#6e7064] dark:text-gray-400">试着这样问</p>
        <p className="mb-0 text-xs leading-5 text-[#34362e] dark:text-gray-200">{service.prompt}</p>
        {service.guide ? (
          <p className="mb-0 mt-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">
            先在仓库执行 <code>npm run mcp:stdio:check</code>，再将配置中的脚本和密钥改为本机绝对路径。
          </p>
        ) : null}
      </div>
    </article>
  )
}

export default function McpCenterPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <header className="mb-5 border-b border-[#dee0db] pb-5 dark:border-[#202938]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#626358] dark:text-gray-400">
              <Link href="/works" className="underline-offset-4 hover:underline">AI 项目</Link>
              <span>/</span>
              <span>MCP 中心</span>
            </div>
            <h1 className="mb-2 font-serif text-3xl font-semibold tracking-normal text-[#191915] dark:text-gray-100 md:text-4xl">把内容接入智能体的服务货架</h1>
            <p className="mb-0 max-w-3xl text-sm leading-6 text-[#43433b] dark:text-gray-300 md:text-base">
              Skill 告诉智能体“怎么做”，MCP 让智能体“能连接什么”。选择服务、复制配置，即可开始调用。
            </p>
          </div>
          <div className="self-start">
            <SharePageButton title="MCP 中心" text="面向 AI 智能体的 MCP 服务中心。" url="/mcp-center" />
          </div>
        </div>
      </header>

      <section className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((service) => <McpServiceCard key={service.name} service={service} />)}
      </section>

      <section className="mt-5 rounded-lg border border-[#d2d3c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">安全边界</h2>
          <Pill>远程授权 + 本地进程</Pill>
        </div>
        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY_ITEMS.map(([title, desc]) => (
            <article key={title}>
              <h3 className="mb-1 border-b-0 pb-0 text-xs font-semibold text-[#25271f] dark:text-gray-100">{title}</h3>
              <p className="mb-0 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{desc}</p>
            </article>
          ))}
        </div>
        <details className="group mt-3 border-t border-[#dedfd5] pt-2 dark:border-[#263241]">
          <summary className="cursor-pointer list-none text-xs text-[#8b5a1f] marker:hidden dark:text-[#a1ab76]">查看完整鉴权说明 →</summary>
          <p className="mb-0 mt-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">
            文章服务中的站点登录会话、OAuth 授权服务与 MCP Resource Server 分开运行：Cookie 只确认用户身份，文章 MCP 只接受面向自身 audience、包含 <code>articles:read</code> scope 的短期 Access Token。本地 stdio Demo 不开网络端口，密钥由本机进程读取；但工具入参与结果仍可能进入 WorkBuddy 和模型上下文。
          </p>
        </details>
      </section>

      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          ['1', '选择传输', 'HTTPS 配置 URL；stdio 配置本地 command。'],
          ['2', '准备权限', '远程服务走 OAuth；本地服务只授予所需文件权限。'],
          ['3', '先自测再联调', '先跑 stdio 自测，再在 WorkBuddy 发现和调用工具。'],
        ].map(([number, title, desc]) => (
          <li key={number} className="flex gap-3 rounded-md border border-[#d2d3c8] bg-white p-3 dark:border-[#283443] dark:bg-[#101820]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaebe3] font-mono text-[10px] text-[#8b5a1f] dark:bg-[#17212d] dark:text-[#a1ab76]">{number}</span>
            <span>
              <strong className="block text-xs text-[#25271f] dark:text-gray-100">{title}</strong>
              <span className="text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{desc}</span>
            </span>
          </li>
        ))}
      </ol>
    </PageContainer>
  )
}
