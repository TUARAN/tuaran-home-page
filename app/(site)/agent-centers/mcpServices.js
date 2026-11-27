export const MCP_CENTER_ENDPOINT = 'https://2aran.com/api/mcp/articles'
export const MCP_WEATHER_ENDPOINT = 'https://2aran.com/api/mcp/weather'

const JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-articles': { url: MCP_CENTER_ENDPOINT },
  },
}, null, 2)
const CODEX_CONFIG = `[mcp_servers.tuaran-articles]\nurl = "${MCP_CENTER_ENDPOINT}"`
const WEATHER_JSON_CONFIG = JSON.stringify({
  mcpServers: {
    'tuaran-weather-test': { url: MCP_WEATHER_ENDPOINT },
  },
}, null, 2)
const WEATHER_CODEX_CONFIG = `[mcp_servers.tuaran-weather-test]\nurl = "${MCP_WEATHER_ENDPOINT}"`
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

export const MCP_CENTER_SERVICES = [
  {
    name: 'tuaran-articles',
    kind: 'remote',
    title: '涂阿燃文章 MCP',
    transport: 'Streamable HTTP',
    endpoint: MCP_CENTER_ENDPOINT,
    tags: ['已上架', 'OAuth 2.1', '公开只读'],
    desc: '查询本站公开文章、专题调研和资源。首次连接会跳转登录与授权页。',
    tools: ['get_recent_articles', 'search_articles'],
    config: JSON_CONFIG,
    codexConfig: CODEX_CONFIG,
    prompt: '“调用 tuaran-articles，告诉我涂阿燃最近更新了哪些 AI Agent 相关文章。”',
  },
  {
    name: 'tuaran-weather-test',
    kind: 'remote',
    title: '天气查询测试 MCP',
    transport: 'Streamable HTTP',
    endpoint: MCP_WEATHER_ENDPOINT,
    tags: ['测试服务', '无需登录', '公开只读'],
    desc: '快速验证客户端连接和工具调用，支持按中英文城市名查询 Open-Meteo 天气。',
    tools: ['get_current_weather', 'get_weather_forecast'],
    config: WEATHER_JSON_CONFIG,
    codexConfig: WEATHER_CODEX_CONFIG,
    prompt: '“调用 tuaran-weather-test，查询广州现在的天气和未来三天预报。”',
  },
  {
    name: 'tuaran-local-crypto-demo',
    kind: 'local',
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

export const MCP_SECURITY_ITEMS = [
  ['能力最小化', '远程服务仅读公开数据；本地 Demo 不读任意文件、不执行 shell。'],
  ['协议与输入校验', '校验 JSON-RPC、MCP 版本、请求体大小、工具名和参数范围。'],
  ['按服务区分授权', '文章 MCP 使用 OAuth 与 PKCE；天气测试 MCP 无需登录。'],
  ['滥用控制', '按 IP 做分钟与每日限流，线上叠加 Cloudflare WAF。'],
]