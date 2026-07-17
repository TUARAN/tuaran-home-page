import PageContainer from '../components/PageContainer'
import AgentCenterHero from '../components/AgentCenterHero'
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

const MCP_GUIDE = [
  { title: '选择传输', desc: '线上服务优先 Streamable HTTP，本地能力使用 stdio 子进程。', examples: ['HTTP', 'stdio', '端点'] },
  { title: '只给所需权限', desc: '按服务设置 OAuth scope、文件范围与环境变量，不共享无关凭据。', examples: ['OAuth', 'scope', '密钥'] },
  { title: '先看工具契约', desc: '确认工具名、参数、返回结构和错误语义，再交给 Agent 调用。', examples: ['tools', 'schema', '错误'] },
  { title: '保留安全边界', desc: '远程内容可能携带注入指令；执行、写入和敏感操作必须额外确认。', examples: ['注入', '限流', '确认'] },
]

function Pill({ children }) {
  return (
    <span className="inline-flex rounded-sm bg-[#eceae2] px-2 py-0.5 font-mono text-[10px] leading-5 text-[#666653] dark:bg-[#17212d] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

function McpServiceCard({ service }) {
  const prompts = service.prompts || [service.prompt]

  return (
    <article className="flex min-w-0 flex-col py-6">
      <header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 truncate font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{service.name}</p>
            <h2 className="mb-1.5 border-b-0 pb-0 font-serif text-xl font-semibold leading-tight text-[#1c1d18] dark:text-gray-100">{service.title}</h2>
            <div className="flex flex-wrap gap-1">
              <Pill>{service.transport}</Pill>
              {service.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
            </div>
          </div>
          <McpConfigActions title={service.title} config={service.config} codexConfig={service.codexConfig} />
        </div>
        <p className="mb-0 mt-2.5 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{service.desc}</p>
      </header>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
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

      <div className="mt-5 border-l-2 border-[#c8b184] pl-3 dark:border-[#687348]">
        <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[#6e7064] dark:text-gray-400">{prompts.length > 1 ? '对应用法' : '试着这样问'}</p>
        {prompts.length > 1 ? (
          <ol className="mb-0 grid gap-1 pl-4 text-xs leading-5 text-[#34362e] dark:text-gray-200">
            {prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ol>
        ) : (
          <p className="mb-0 text-xs leading-5 text-[#34362e] dark:text-gray-200">{prompts[0]}</p>
        )}
        {service.guide ? (
          <p className="mb-0 mt-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">
            当前配置已在 WorkBuddy 5.2.5 验证为 3/3 个工具启用。其他电脑复制时，需要把 Node、脚本和密钥路径改成该设备的真实绝对路径；可先在仓库执行 <code>npm run mcp:stdio:check</code> 自测。
          </p>
        ) : null}
      </div>
    </article>
  )
}

export default function McpCenterPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <AgentCenterHero
        current="/mcp-center"
        eyebrow="MCP 中心"
        title="把内容接入智能体的服务货架"
        description="Skill 告诉智能体“怎么做”，MCP 让智能体“能连接什么”。选择服务、复制配置，即可开始调用。"
        shareText="面向 AI 智能体的 MCP 服务中心。"
      />

      <section className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
        {MCP_GUIDE.map((item, index) => (
          <article key={item.title} className="min-w-0">
            <span className="mb-3 block font-mono text-[10px] tracking-[0.16em] text-[#a06d2d] dark:text-[#a1ab76]">0{index + 1}</span>
            <h2 className="mb-1 border-b-0 pb-0 text-sm font-semibold text-[#1c1d18] dark:text-gray-100">{item.title}</h2>
            <p className="mb-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{item.desc}</p>
            <div className="flex flex-wrap gap-1">{item.examples.map((example) => <Pill key={example}>{example}</Pill>)}</div>
          </article>
        ))}
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">已上架 MCP</h2>
        <Pill>{SERVICES.length} 个</Pill>
      </div>
      <section className="divide-y divide-[#d8d7cf] border-y border-[#d8d7cf] dark:divide-[#283443] dark:border-[#283443]">
        {SERVICES.map((service) => <McpServiceCard key={service.name} service={service} />)}
      </section>

      <section className="mt-8 bg-[#efede5] px-5 py-6 dark:bg-[#111a24] md:px-6">
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

      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {[
          ['1', '选择传输', 'HTTPS 配置 URL；stdio 配置本地 command。'],
          ['2', '准备权限', '远程服务走 OAuth；本地服务只授予所需文件权限。'],
          ['3', '先自测再联调', '先跑 stdio 自测，再在 WorkBuddy 发现和调用工具。'],
        ].map(([number, title, desc]) => (
          <li key={number} className="flex gap-3">
            <span className="font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">0{number}</span>
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
