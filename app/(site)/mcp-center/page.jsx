import PageContainer from '../components/PageContainer'
import AgentCenterHero from '../components/AgentCenterHero'
import McpConfigActions from './McpConfigActions'
import { IconPlugConnected } from '@tabler/icons-react'

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
const LOCAL_NODE_PATH = '/Users/tuaran/.local/bin/node'
const LOCAL_SERVER_PATH = '/Users/tuaran/Documents/GitHub/tuaran-home-page/tools/mcp-stdio-demo/server.mjs'
const LOCAL_SECRET_PATH = '/Users/tuaran/Documents/GitHub/tuaran-home-page/tools/mcp-stdio-demo/crypto-demo.key'
const LOCAL_STDIO_JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-local-crypto-demo': {
      type: 'stdio',
      command: LOCAL_NODE_PATH,
      args: [LOCAL_SERVER_PATH],
      env: { LOCAL_MCP_SECRET_FILE: LOCAL_SECRET_PATH },
      description: '本地 AES-256-GCM 加解密联调 Demo',
      disabled: false,
    },
  },
}, null, 2)
const LOCAL_STDIO_CODEX_CONFIG = `[mcp_servers.tuaran-local-crypto-demo]\ncommand = "${LOCAL_NODE_PATH}"\nargs = ["${LOCAL_SERVER_PATH}"]\nenv = { LOCAL_MCP_SECRET_FILE = "${LOCAL_SECRET_PATH}" }`

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
    endpoint: `${LOCAL_NODE_PATH} ${LOCAL_SERVER_PATH}`,
    tags: ['WorkBuddy 已验证', '3 个工具', '本地密钥'],
    desc: '由 WorkBuddy 在本机拉起 Node.js 进程，在本地执行 AES-256-GCM 加解密。配置已使用真实绝对路径验证，可直接用于当前维护机。',
    tools: ['local_runtime_info', 'local_encrypt_text', 'local_decrypt_text'],
    config: LOCAL_STDIO_JSON_CONFIG,
    codexConfig: LOCAL_STDIO_CODEX_CONFIG,
    prompts: [
      '“调用 tuaran-local-crypto-demo 的 local_runtime_info，确认本地进程和密钥状态。”',
      '“调用 local_encrypt_text，把「这是一段本地测试文本」加密。”',
      '“调用 local_decrypt_text，解密刚才返回的 v1 密文。”',
    ],
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
    <span className="inline-flex rounded-full bg-[#eeefe9] px-2.5 py-1 text-[11px] leading-4 text-[#626653] dark:bg-[#25303a] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

function McpServiceCard({ service }) {
  const prompts = service.prompts || [service.prompt]

  return (
    <article id={service.name} className="flex min-w-0 scroll-mt-28 flex-col rounded-2xl border border-[#d8d9d5] bg-white/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_14px_34px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967] sm:p-6">
      <header>
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6ecf0] text-[#42617a] dark:bg-[#20313e] dark:text-[#b9d0de]"><IconPlugConnected size={23} stroke={1.7} /></span>
          <Pill>{service.transport}</Pill>
        </div>
        <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{service.name}</p>
        <h2 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{service.title}</h2>
        <p className="mb-4 text-sm leading-6 text-[var(--site-muted)]">{service.desc}</p>
        <div className="flex flex-wrap gap-1.5">{service.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {service.tools.map((tool) => <code key={tool} className="rounded-md bg-[#f3f4ef] px-2 py-1 font-mono text-[10px] text-[#555640] dark:bg-[#25303a] dark:text-gray-300">{tool}</code>)}
      </div>

      <div className="mt-5 rounded-xl bg-[#f5f3ee] p-4 dark:bg-[#1a2530]">
        <p className="mb-1 text-[11px] font-semibold text-[var(--site-muted)]">试着这样问</p>
        {prompts.length > 1 ? (
          <ol className="mb-0 grid gap-1 pl-4 text-xs leading-5 text-[#34362e] dark:text-gray-200">
            {prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ol>
        ) : (
          <p className="mb-0 text-xs leading-5 text-[#34362e] dark:text-gray-200">{prompts[0]}</p>
        )}
      </div>
      {service.guide ? <p className="mb-0 mt-3 text-xs leading-5 text-[var(--site-muted)]">本地 Demo 需要将配置中的 Node、脚本和密钥路径改为当前设备的真实路径。</p> : null}
      <div className="mt-auto border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
        <McpConfigActions title={service.title} config={service.config} codexConfig={service.codexConfig} />
      </div>
    </article>
  )
}

export default function McpCenterPage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <AgentCenterHero
        current="/mcp-center"
        eyebrow="MCP · 连什么"
        title="让智能体接入真实服务"
        description="选择一个 MCP 服务，查看能调用的工具，复制配置后在支持 MCP 的客户端中使用。"
        shareText="面向 AI 智能体的 MCP 服务中心。"
        count={SERVICES.length}
        countLabel="个可连接服务"
        actionLabel="浏览服务"
      />

      <section id="items" className="scroll-mt-28">
        <div className="mb-5">
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6b2f] dark:text-[#d1aa6c]">Explore services</p>
          <h2 className="mb-0 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">选择要连接的服务</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((service) => <McpServiceCard key={service.name} service={service} />)}
        </div>
      </section>

      <details className="mt-10 rounded-2xl border border-[#d8d9d5] bg-white/60 p-5 dark:border-[#2b333e] dark:bg-[#111821]/70 sm:p-6">
        <summary className="cursor-pointer text-base font-bold text-[var(--site-ink)]">连接与安全说明</summary>
        <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="mb-0 border-b-0 pb-0 text-lg font-semibold text-[#1c1d18] dark:text-gray-100">使用前请确认</h2>
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
        </div>
      </details>
    </PageContainer>
  )
}
