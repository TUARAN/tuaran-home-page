const ISSUE_BASE = 'https://github.com/TUARAN/tuaran-home-page/issues'

export const AUTOPILOT_SCAN_BOARD_HREF = '/admin/autopilot-scans'
export const AUTOPILOT_SCAN_SNAPSHOT_AT = '2026-11-03'

export const AUTOPILOT_BUCKETS = {
  safe: { id: 'safe', label: '无痛可做', tone: 'success' },
  defer: { id: 'defer', label: '搁置', tone: 'warning' },
  hygiene: { id: 'hygiene', label: '不进待办', tone: 'neutral' },
}

export const AUTOPILOT_SEVERITIES = {
  high: { id: 'high', label: '高', tone: 'danger' },
  medium: { id: 'medium', label: '中', tone: 'warning' },
  low: { id: 'low', label: '低', tone: 'neutral' },
  info: { id: 'info', label: '信息', tone: 'info' },
}

const BUCKET_ORDER = { safe: 0, defer: 1, hygiene: 2 }
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 }

function scanIssue(number, type, date, pendingCount, { latest = false, state = 'open' } = {}) {
  const scan = type === 'security' ? 'security' : 'performance'
  return {
    number,
    type,
    date,
    pendingCount,
    latest,
    state,
    title: `[autopilot] ${scan} 巡检 ${date}：${pendingCount} 个待处理项`,
    url: `${ISSUE_BASE}/${number}`,
  }
}

function finding(id, severity, title, bucket, note) {
  return { id, severity, title, bucket, note }
}

const COMPATIBLE_TOOLCHAIN = '开发工具链上的传递漏洞。优先 npm audit fix，本轮不改版本。'
const COMPATIBLE_DIRECT = '直接依赖上的漏洞。优先 npm audit fix 的兼容升级，本轮不改版本。'

export const AUTOPILOT_OPEN_ISSUES = [
  scanIssue(69, 'security', '2026-11-02', 24, { latest: true }),
  scanIssue(68, 'performance', '2026-10-28', 2, { latest: true }),
]

export const AUTOPILOT_CLOSED_ISSUES = [
  scanIssue(67, 'security', '2026-10-26', 23, { state: 'closed' }),
  scanIssue(66, 'security', '2026-10-19', 24, { state: 'closed' }),
  scanIssue(64, 'security', '2026-10-12', 24, { state: 'closed' }),
  scanIssue(63, 'security', '2026-10-05', 24, { state: 'closed' }),
  scanIssue(61, 'security', '2026-09-28', 23, { state: 'closed' }),
  scanIssue(60, 'security', '2026-09-21', 23, { state: 'closed' }),
  scanIssue(58, 'security', '2026-09-14', 23, { state: 'closed' }),
  scanIssue(57, 'security', '2026-09-07', 23, { state: 'closed' }),
  scanIssue(55, 'security', '2026-08-31', 22, { state: 'closed' }),
  scanIssue(54, 'security', '2026-08-24', 22, { state: 'closed' }),
  scanIssue(52, 'security', '2026-08-17', 22, { state: 'closed' }),
  scanIssue(51, 'security', '2026-08-10', 22, { state: 'closed' }),
  scanIssue(49, 'security', '2026-08-03', 19, { state: 'closed' }),
  scanIssue(47, 'security', '2026-07-31', 19, { state: 'closed' }),
  scanIssue(65, 'performance', '2026-10-14', 2, { state: 'closed' }),
  scanIssue(62, 'performance', '2026-09-30', 2, { state: 'closed' }),
  scanIssue(59, 'performance', '2026-09-16', 2, { state: 'closed' }),
  scanIssue(56, 'performance', '2026-09-02', 2, { state: 'closed' }),
  scanIssue(53, 'performance', '2026-08-19', 2, { state: 'closed' }),
  scanIssue(50, 'performance', '2026-08-05', 2, { state: 'closed' }),
  scanIssue(46, 'performance', '2026-07-31', 2, { state: 'closed' }),
]

export const AUTOPILOT_SECURITY_FINDINGS = [
  finding('sec-cloudflare-next-on-pages', 'medium', '依赖漏洞：@cloudflare/next-on-pages（moderate）', 'safe', '后台构建工具。只接受兼容升级，本轮不改版本。'),
  finding('sec-electron-asar', 'medium', '依赖漏洞：@electron/asar（moderate）', 'safe', 'Electron 打包链上的传递漏洞。优先兼容升级，本轮不改 Electron 大版本。'),
  finding('sec-electron-universal', 'medium', '依赖漏洞：@electron/universal（moderate）', 'safe', 'Electron 打包链上的传递漏洞。优先兼容升级，本轮不改 Electron 大版本。'),
  finding('sec-eslint-eslintrc', 'medium', '依赖漏洞：@eslint/eslintrc（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-fastify-busboy', 'high', '依赖漏洞：@fastify/busboy（high）', 'safe', 'high。先尝试 npm audit fix 的兼容升级；父包只能大版本时再改记搁置。本轮不升级。'),
  finding('sec-huggingface-transformers', 'high', '依赖漏洞：@huggingface/transformers（high）', 'defer', '直接依赖，修复通常要跨大版本。本轮不升级。'),
  finding('sec-humanwhocodes-config-array', 'medium', '依赖漏洞：@humanwhocodes/config-array（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-tailwindcss-typography', 'medium', '依赖漏洞：@tailwindcss/typography（moderate）', 'safe', COMPATIBLE_DIRECT),
  finding('sec-tiptap-core', 'high', '依赖漏洞：@tiptap/core（high）', 'defer', '编辑器核心。修复通常要带动整组 @tiptap 大版本，本轮不升级。'),
  finding('sec-tootallnate-once', 'low', '依赖漏洞：@tootallnate/once（low）', 'safe', 'low，未进入 #69 的待修勾选。npm audit fix 能兼容升级时可以顺手带上。'),
  finding('sec-ts-morph-common', 'medium', '依赖漏洞：@ts-morph/common（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-typescript-eslint-plugin', 'medium', '依赖漏洞：@typescript-eslint/eslint-plugin（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-typescript-eslint-parser', 'medium', '依赖漏洞：@typescript-eslint/parser（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-typescript-eslint-type-utils', 'medium', '依赖漏洞：@typescript-eslint/type-utils（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-typescript-eslint-estree', 'medium', '依赖漏洞：@typescript-eslint/typescript-estree（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-typescript-eslint-utils', 'medium', '依赖漏洞：@typescript-eslint/utils（moderate）', 'safe', COMPATIBLE_TOOLCHAIN),
  finding('sec-vercel-blob', 'medium', '依赖漏洞：@vercel/blob（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-express', 'medium', '依赖漏洞：@vercel/express（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-fun', 'high', '依赖漏洞：@vercel/fun（high）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-gatsby', 'medium', '依赖漏洞：@vercel/gatsby-plugin-vercel-builder（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-hono', 'medium', '依赖漏洞：@vercel/hono（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-hydrogen', 'medium', '依赖漏洞：@vercel/hydrogen（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-next', 'medium', '依赖漏洞：@vercel/next（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-nft', 'medium', '依赖漏洞：@vercel/nft（moderate）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-vercel-node', 'high', '依赖漏洞：@vercel/node（high）', 'defer', 'vercel CLI 带入的传递依赖。按大版本搁置，本轮不升级。'),
  finding('sec-hsts-next-config', 'info', '未在 next.config.js 中发现 HSTS 配置', 'defer', '静态检查的信息项。响应头策略另作决定，本轮不改 next.config.js。'),
  finding('sec-csp-next-config', 'info', '未在 next.config.js 中发现 CSP 配置', 'defer', '静态检查的信息项。响应头策略另作决定，本轮不改 next.config.js。'),
  finding('sec-hsts-middleware', 'info', '未在 middleware.js 中发现 HSTS 配置', 'defer', '静态检查的信息项。响应头策略另作决定，本轮不改 middleware.js。'),
  finding('sec-csp-middleware', 'info', '未在 middleware.js 中发现 CSP 配置', 'defer', '静态检查的信息项。响应头策略另作决定，本轮不改 middleware.js。'),
]

export const AUTOPILOT_PERFORMANCE_FINDINGS = [
  finding('perf-ai-fomo-mp4', 'low', '大媒体文件：public/feed/ai-fomo-big-tree-2026-07-21.mp4（23.7 MiB）', 'hygiene', '已知大媒体。low 不进入待修勾选，本轮不压缩、不搬迁。'),
  finding('perf-public-total', 'info', 'public/ 总量 341 MiB（832 个文件）', 'hygiene', '体量信息。info 不进入待修勾选。'),
  finding('perf-users-console', 'low', '大源文件：app/(admin)/admin/users/UsersConsole.jsx（1038 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-agent-world-cup', 'low', '大源文件：app/(site)/agent-world-cup/AgentWorldCupClient.jsx（1077 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-articles-data', 'low', '大源文件：app/(site)/articles/articlesData.js（1206 行）', 'hygiene', '历史归档数据。本轮不拆。'),
  finding('perf-cancers-overview', 'low', '大源文件：app/(site)/cancers-overview/CancersOverviewClient.jsx（1055 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-site-header', 'low', '大源文件：app/(site)/components/SiteHeader.jsx（1031 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-ming-qing', 'medium', '超大源文件：app/(site)/history/ming-qing/page.jsx（2235 行）', 'defer', '超大页面。拆分会牵动历史专题，本轮搁置。'),
  finding('perf-platform-pairs', 'low', '大源文件：app/(site)/platform-framework-pairs/PlatformFrameworkPairsClient.jsx（1185 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-tang-ping-map', 'low', '大源文件：app/(site)/tang-ping-map/TangPingMapClient.jsx（1223 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-points', 'low', '大源文件：lib/ledger/points.js（1179 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-nano-banana', 'medium', '超大源文件：lib/page-data/nanoBananaCases.js（2861 行）', 'defer', '超大数据模块。拆分会牵动案例数据，本轮搁置。'),
  finding('perf-question-bank', 'low', '大源文件：lib/page-data/questionBank2026.js（1216 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-tang-ping-data', 'low', '大源文件：lib/page-data/tangPingMapData.js（1578 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
  finding('perf-research-catalog', 'low', '大源文件：lib/research/catalog.js（1058 行）', 'hygiene', '低于超大文件阈值。本轮不拆。'),
]

export const AUTOPILOT_SCAN_PLAN = [
  '重复巡检 Issue 已在 2026-11-03 关闭。开放巡检只留安全 #69 与性能 #68，旧单不再单独跟踪。',
  '安全依赖里标成「无痛可做」的条目，下一步用 npm audit fix 做兼容范围内的升级。这些只是待办，本轮不改 package.json，也不升大版本。',
  '继续搁置四条响应头信息项：next.config.js 与 middleware.js 里的 HSTS、CSP。',
  '继续搁置高风险依赖：@tiptap/core、@huggingface/transformers，以及 vercel CLI 带入的整组 @vercel/*。',
  '继续搁置两处超大文件：app/(site)/history/ming-qing/page.jsx 与 lib/page-data/nanoBananaCases.js。性能单里的 low/info 不进入待办。',
  '设计巡检的 info 级问题不自动建 Issue。台账里的设计巡检打开同一页，当前没有单独的待修单。',
]

export function sortAutopilotFindings(findings) {
  return [...(findings || [])].sort((left, right) => (
    (BUCKET_ORDER[left.bucket] ?? 9) - (BUCKET_ORDER[right.bucket] ?? 9)
    || (SEVERITY_ORDER[left.severity] ?? 9) - (SEVERITY_ORDER[right.severity] ?? 9)
    || left.title.localeCompare(right.title, 'en')
  ))
}

export function summarizeAutopilotScanBoard({
  openIssues = AUTOPILOT_OPEN_ISSUES,
  closedIssues = AUTOPILOT_CLOSED_ISSUES,
  securityFindings = AUTOPILOT_SECURITY_FINDINGS,
  performanceFindings = AUTOPILOT_PERFORMANCE_FINDINGS,
} = {}) {
  const findings = [...securityFindings, ...performanceFindings]
  const countBucket = (bucket) => findings.filter((item) => item.bucket === bucket).length
  const latestSecurity = openIssues.find((item) => item.type === 'security' && item.latest) || null
  const latestPerformance = openIssues.find((item) => item.type === 'performance' && item.latest) || null
  return {
    openTotal: openIssues.length,
    openSecurity: openIssues.filter((item) => item.type === 'security').length,
    openPerformance: openIssues.filter((item) => item.type === 'performance').length,
    latestSecurity,
    latestPerformance,
    safe: countBucket('safe'),
    defer: countBucket('defer'),
    findingHygiene: countBucket('hygiene'),
    closed: closedIssues.length,
  }
}

export function autopilotScanBoardProblems() {
  const problems = []
  const summary = summarizeAutopilotScanBoard()
  const findings = [...AUTOPILOT_SECURITY_FINDINGS, ...AUTOPILOT_PERFORMANCE_FINDINGS]
  const ids = new Set()
  if (!summary.latestSecurity || summary.latestSecurity.number !== 69) problems.push('最新安全单必须是 #69')
  if (!summary.latestPerformance || summary.latestPerformance.number !== 68) problems.push('最新性能单必须是 #68')
  if (AUTOPILOT_OPEN_ISSUES.filter((item) => item.latest).length !== 2) problems.push('只能有两张最新单')
  for (const item of findings) {
    if (ids.has(item.id)) problems.push(`发现 id 重复：${item.id}`)
    ids.add(item.id)
    if (!AUTOPILOT_BUCKETS[item.bucket]) problems.push(`未知分桶：${item.id}`)
    if (!AUTOPILOT_SEVERITIES[item.severity]) problems.push(`未知级别：${item.id}`)
  }
  const openNumbers = AUTOPILOT_OPEN_ISSUES.map((item) => item.number)
  const closedNumbers = AUTOPILOT_CLOSED_ISSUES.map((item) => item.number)
  if (new Set(openNumbers).size !== openNumbers.length) problems.push('开放 Issue 编号重复')
  if (new Set(closedNumbers).size !== closedNumbers.length) problems.push('已关闭 Issue 编号重复')
  if (openNumbers.some((number) => closedNumbers.includes(number))) problems.push('同一 Issue 不能同时开放和关闭')
  if (summary.openTotal !== 2 || summary.openSecurity !== 1 || summary.openPerformance !== 1) problems.push('开放巡检必须只剩 #69 与 #68')
  if (!AUTOPILOT_OPEN_ISSUES.every((item) => item.state === 'open' && item.latest)) problems.push('开放巡检必须都是最新单')
  if (!AUTOPILOT_CLOSED_ISSUES.every((item) => item.state === 'closed' && !item.latest)) problems.push('旧单必须标记为已关闭')
  if (summary.safe !== 14 || summary.defer !== 17 || summary.findingHygiene !== 13) problems.push('分桶数量与 #69/#68 归类不一致')
  if (summary.closed !== 21) problems.push('已关闭的重复巡检数量不对')
  const deferredTitles = findings.filter((item) => item.bucket === 'defer').map((item) => item.title).join('\n')
  for (const marker of ['@tiptap/core', '@huggingface/transformers', '@vercel/', 'HSTS', 'CSP', 'ming-qing/page.jsx', 'nanoBananaCases.js']) {
    if (!deferredTitles.includes(marker)) problems.push(`搁置清单缺少 ${marker}`)
  }
  const safeTitles = findings.filter((item) => item.bucket === 'safe').map((item) => item.title).join('\n')
  for (const marker of ['@tiptap/core', '@huggingface/transformers', '@vercel/', 'HSTS', 'CSP', 'ming-qing', 'nanoBananaCases']) {
    if (safeTitles.includes(marker)) problems.push(`无痛可做误收 ${marker}`)
  }
  return problems
}
