import { getContactChannel } from '../site/contactChannels.js'
import { OPENCLAW_ACHIEVEMENT_COUNT } from '../site/openClawAchievements.js'
import { PUBLISHED_WORKS } from '../site/publishedWorks.js'
import { TOOL_ITEMS, TOOL_STATUS_META, TOOL_TYPE_META } from '../site/toolItems.js'

const wechat = getContactChannel('wechat')
const email = getContactChannel('email')

export const TOPIC_HUB_GROUPS = [
  { id: 'essay', title: '文章', note: '可以直接读完的篇目。' },
  { id: 'record', title: '记录', note: '合并、出版和规则的落点。' },
  { id: 'entry', title: '入口', note: '目录、工具和相邻页面。' },
]

const RESEARCH_PUBLIC = {
  "agent-memory-mechanisms": {
    "title": "编码与办公智能体的记忆机制",
    "date": "2026-08-28",
    "section": "AI 与开发",
    "summary": "本地优先，少量已确认偏好常驻，项目经验按需检索；自动提取先审查，跨工具共享保留来源与权限边界。"
  },
  "vibe-coding-judgment-structure": {
    "title": "Vibe Coding 的判断结构：产能放大之后，系统责任仍在人这边",
    "date": "2026-05-26",
    "section": "AI 与开发",
    "summary": "执行正在被 token 平权，判断正在被事故定价。AI 能放大产能，却无法替代系统级责任。"
  },
  "agent-loop-why-now": {
    "title": "Agent Loop 深度调研：把决定权交给模型的一次换代，为什么发生在现在",
    "date": "2026-07-02",
    "section": "AI 与开发",
    "summary": "最小 agent loop 是 while：调工具 → 看结果 → 模型决定是否停止。Prompt / RAG / chain 框架没有消失，多数降为 loop 里的组件。AutoGPT 2023 已试过同类循环但当时单步能力不够。截至 2026-11-04，METR TH1.1、MCP 进入 Linux 基金会 AAIF、Claude Managed Agents / 编码代理产品线，是「为什么是现在」的可引用锚点。个人开发者：先掌握最小实现；框架与 multi-agent 按需。"
  },
  "chat-to-agent-loop-anthropic-practice": {
    "title": "从 Chat 到 Agent Loop：Anthropic 实践路径与可复用决策树",
    "date": "2026-06-05",
    "section": "AI 与开发",
    "summary": "路径按阶升级：单次调用够用就停；需要确定性编排用 workflow；需要模型决定下一步才上 agent loop——避免「开对话就上 agent」。Building Effective Agents（2024-12）讲模式；Managed Agents（beta，API header `managed-agents-2026-04-01`）讲托管运行时（agent / environment / session / events）。Claude Code 把同一 loop 嵌进终端与仓库。个人开发者优先自己写最小循环，再决定是否托管。"
  },
  "mcp-2026-07-28-stateless-protocol": {
    "title": "MCP 2026-07-28：无状态协议内核与实现边界",
    "date": "2026-07-29",
    "section": "AI 与开发",
    "summary": "无状态只覆盖协议内核——每个请求自带版本与能力，负载均衡不再依赖 MCP 会话粘滞。跨调用状态、用户确认、订阅流仍在，只是换了承载方式。迁移不能只删 Mcp-Session-Id；实现是否跟上以各 SDK/平台兼容表为准，不以「支持 MCP」四字代替。"
  },
  "office-agent-mcp-unified-authorization-architecture": {
    "title": "办公智能体 × MCP × 统一认证：协议事实与架构建议分层",
    "date": "2026-07-16",
    "section": "AI 与开发",
    "summary": "协议事实：MCP 客户端按受保护资源元数据发现授权服务器，走 Authorization Code + PKCE，并在授权与 Token 请求中携带 resource；MCP 服务作为 Resource Server 校验 audience。架构建议：办公智能体当 OAuth Client，统一认证授权服务当 AS，MCP 不向下游透传入站 Token。具体产品是否实现 CIMD、DPoP、Token Exchange 等，以该产品文档为准，本稿不编造。"
  },
  "multi-agent-frameworks-comparison": {
    "title": "多 Agent 框架横向对比：AgentScope 2.0 / LangGraph / AutoGen / LangChain（附 OpenClaw Skill）",
    "date": "2026-06-26",
    "section": "AI 与开发",
    "summary": "四者分层：LangChain 是单 Agent 工具库，LangGraph 是流程/状态编排，AgentScope 2.0 偏企业多 Agent 运行时，AutoGen 是对话式多 Agent 原型（微软以 Agent Framework 为后续主线）。OpenClaw Skill 同样渐进式披露。「AgentScope 调度 OpenClaw 节点」仍未从官方资料证实。星级只表示相对侧重。"
  },
  "15-minutes-understand-large-language-models": {
    "title": "15 分钟了解大模型：从 Token、矩阵运算到 RAG 与 Agent",
    "date": "2026-06-01",
    "section": "分析",
    "summary": "大模型的底层是 Token 概率建模和大规模矩阵运算；Transformer 负责理解上下文，KV Cache 负责降低推理重复计算，RAG 负责接入外部知识，Agent 负责把模型从回答问题推进到执行任务。"
  },
  "workbuddy-skill-channel-architecture": {
    "title": "用 Skill 实现 Channel：WorkBuddy / CodeBuddy 的可行路径与边界",
    "date": "2026-07-17",
    "section": "WorkBuddy",
    "summary": "截至 2026 年 7 月，CodeBuddy Code 已公开 Channels Beta，自定义 channel 可通过特殊 MCP server 向运行中的会话推送事件，并用 reply 工具实现双向通信。Skill 适合放路由策略、格式转换和业务流程，不适合独自承担常驻连接、身份认证、可靠投递与会话隔离。桌面 WorkBuddy 已有多种官方 IM 接入和 Hook 插件，但自定义 channel 是否复用 CLI 的完整协议，仍需按版本实测。"
  },
  "cloudflare-edge-agents-practice": {
    "title": "Cloudflare 边缘智能体：Workers、Durable Objects 与 Agents SDK",
    "date": "2026-06-03",
    "section": "Web 与云",
    "summary": "Cloudflare 把 Durable Objects 当 actor、Workflows 当可恢复长任务、Agents SDK 当封装层，再叠 AI Gateway 做模型路由——适合轻量、长尾、全球分布的 Agent。CPU 默认 30s 可调到 5 分钟；「唯一全栈」之类营销表述降级为对照表判断。"
  },
  "openclaw-repo-snapshot-pr-guide": {
    "title": "OpenClaw 仓库快照与提 PR：外部贡献者如何把改动送到 main",
    "date": "2026-06-03",
    "section": "AI 与开发",
    "summary": "OpenClaw 主线已是多渠道 AI agent runtime + 插件 SDK + Gateway 安全边界。外部 PR 先读现行 CONTRIBUTING 与 PR 模板；ClawSweeper 现为顾问式审核，证据写进 PR body，小而可证的改动优先。"
  },
  "nextjs-cloudflare-performance-optimization": {
    "title": "Next.js 个人站点首屏加载与 Cloudflare 部署性能优化复盘",
    "date": "2026-05-31",
    "section": "站点工程",
    "summary": "主站与 /web-llm 从 layout 层解耦，收窄 middleware，补齐 Cloudflare 静态缓存，并明确首屏关键图片调度。估算：首页冷启动约 3%–10%，二次访问体感约 10%–30%，静态资源重复下载可降 50%–95%——均待 RUM/Lighthouse 复核。"
  },
  "cloudflare-d1-free-tier-limit-enforcement": {
    "title": "Cloudflare D1 Free 层硬限额：公开口径、错误串与本站静态对照",
    "date": "2026-09-02",
    "section": "Web 与云",
    "summary": "Free 层读/写是按日硬顶，不是软提示。定价页与 2026-09-01 changelog 对额度、错误串、UTC 重置口径一致。站点侧只能确认静态路径与某一时刻面板快照。两则强制日期冲突未解，不影响「超限即拒」这一结论。"
  },
  "cloudflare-d1-vs-supabase": {
    "title": "Cloudflare Workers + D1 vs Supabase 技术调研",
    "date": "2026-06-09",
    "section": "分析",
    "summary": "两套世界观——Cloudflare「边缘乐高 + D1 SQLite」，Supabase「Postgres 大礼包」。已 all-in CF 的站长不必迁；多用户 SaaS / RLS / Realtime 优先 Supabase。Vibe Coding 时选型必须在第一句提示语钉死，否则 AI 默认 Prisma/Postgres 导致大面积返工。切换 **Composer 2.5** tab 看提示语模板。"
  },
  "cloudflare-free-paid-service-boundaries": {
    "title": "Cloudflare 免费与付费服务边界深度调研",
    "date": "2026-07-02",
    "section": "分析",
    "summary": "Cloudflare 免费层适合个人站、静态站、早期 MVP、轻量 API、低频 Worker、少量对象存储和 50 人以内 Zero Trust PoC。付费层买的是确定性：更高运行上限、SLA、合规、安全能力、长期日志、团队支持和按量扩容。生产系统要把套餐费和 Workers、R2、D1、KV、DO、AI、Images、Logs 等按量费用分开建模。"
  },
  "cloudflare-agent-setup-mcp-skills": {
    "title": "Cloudflare Agent Setup：Skills、MCP 与开发代理接线",
    "date": "2026-07-08",
    "section": "Web 与云",
    "summary": "Agent Setup 解决的是「写 Cloudflare 项目的编码代理如何接官方知识与账户工具」，不是 Durable Object Agent 运行时本身。现行 prompt 对多数代理默认注册 `https://mcp.cloudflare.com/mcp`；产品专用 MCP 为可选。docs 只读与账户 OAuth 风险等级不同，应按任务最小化授权。"
  },
  "d1-edge-cache-configurable-ranbi": {
    "title": "D1 做正本、边缘短缓存做加速：可配置燃币 / 权益系统的 Cloudflare Workers 实践",
    "date": "2026-07-12",
    "section": "分析",
    "summary": "规则价格可以缓存 45 秒，单资源覆盖价可以缓存 60 秒；用户余额、已解锁状态、账本和扣款判断不能缓存。这样把运营配置从代码常量移到 D1，又不把权限正确性让给缓存。"
  },
  "resend-email-otp-cloudflare-d1": {
    "title": "邮箱登录与 Resend 邮件验证码配置经验（SyncBlog 实战）",
    "date": "2026-06-03",
    "section": "分析",
    "summary": "把登录从 GitHub OAuth 换成自管邮箱体系，主要为了去掉「必须有 GitHub 账号」这道门槛。技术栈选 Cloudflare Workers + D1 + Resend——Resend 的 Cloudflare 集成把 SPF/DKIM/MX 一键写入，发件域名验证从「半天来回」压到「3 分钟点完」。最大的坑是 EMAIL_FROM 必须用已验证子域、CNAME 必须 DNS only 不开橙云、SESSION_SECRET 一旦换全员重登。"
  },
  "generic-permission-system-cloudflare-redis": {
    "title": "通用后台 / SaaS / APP 权限系统技术分析：数据库持久化、Redis 缓存与 Cloudflare 实践",
    "date": "2026-07-03",
    "section": "分析",
    "summary": "权限系统的核心是“高频校验不拖垮数据库，权限回收后旧权限不能继续生效”。标准做法是 DB 存正本，Redis 缓存用户权限、会话 Token 与角色模板，管理员变更权限后先提交 DB 事务，再主动删除相关用户和角色缓存；下一次请求缓存未命中时回源查 DB。Cloudflare 体系下没有一个等同传统内网 Redis 的原生绑定，生产上优先用 Upstash Redis REST 客户端，或用外部 Redis + Workers TCP sockets；如果要尽量 Cloudflare 原生化，则用 D1/外部数据库做权威层，Durable Objects 做强一致状态与主动失效协调，KV 只适合低敏读多写少缓存，不应单独承担安全权限正本。"
  },
  "2aran-owner-auth-practice": {
    "title": "2aran.com 私有功能鉴权工程分析：统一 owner session、菜单权限化与端到端加密边界",
    "date": "2026-06-05",
    "section": "站点工程",
    "summary": "这套体系经历过三轮迭代：第一轮把\"每个工具各写一套登录\"统一成\"`tuaran_session + ownerAuth`\"；第二轮把\"每个页面组件各自 fetch `/api/me`\"统一成 `SessionProvider` 单一上下文，解决登录状态在不同页面之间割裂的问题；第三轮把\"哪些菜单对谁可见\"从硬编码改成每项菜单的 `audience` 字段 + D1 `nav_overrides` 表，站长可以在 `/agent-ops/nav-admin` 后台动态调整。市面通行做法是 RBAC + feature flag + headless CMS 三块组合；单站长场景下这套轻量方案在保留同等表达力的同时省掉了 80% 的开销。"
  },
  "local-agent-ops-launchd-cloudflare-tunnel": {
    "title": "本地 Agent Ops 控制台架构调研：launchd + Cloudflare Tunnel + 双层鉴权",
    "date": "2026-06-05",
    "section": "分析",
    "summary": "Agent Ops 第一阶段不要急着上云。服务跑本机才能直接调用 Codex / Claude Code / 本地构建 / 仓库扫描。launchd 管常驻进程，Cloudflare Tunnel 解决远程访问且不开公网端口，CF Access + 本地 token 双层鉴权，运行态数据只留本地。下一阶段再拆成「本地 worker + 云端控制台」两个组件。"
  },
  "june-2026-site-retrospective": {
    "title": "6 月，我把个人站从作品集改造成了运营台",
    "date": "2026-07-01",
    "section": "站点工程",
    "summary": "6 月我做的是把 2aran.com 从作品集推向运营台：内容有研究库和灵感流，资源有燃币门槛和下载页，后台能看数据、管用户、调燃币，自动化开始采集 RSS、舆情、世界杯和交易快照。背后的思路是先把个人能力产品化，再把内容、工具、社群和商业闭环接起来。7 月要继续收敛：少做散页面，多做可复用的资源、插件、分发工具和转化路径。"
  },
  "july-2026-site-retrospective": {
    "title": "7 月，2aran.com 从功能扩张转向系统收口",
    "date": "2026-07-31",
    "section": "站点工程",
    "summary": "7 月的主要变化是把已经存在的内容、账号、资源和工具连成可用链路。读者更容易找到内容、管理账号、领取资源并完成互动；智能体可以通过受控 OAuth 查询公开文章；后台与公开站继续隔离。功能仍然增长很快，8 月更需要处理自动提交噪音、入口重叠、部署回归和长期维护成本。"
  },
  "google-adsense-low-value-content-rejection": {
    "title": "Google AdSense 提示“低价值内容”：政策怎么规定，2aran.com 应该怎么整改",
    "date": "2026-07-14",
    "section": "站点工程",
    "summary": "2aran.com 不缺页面。先不要机械补字或继续批量发文；优先重做 20—30 篇能证明本人经验的核心内容，补代码、截图、数据和修订记录，合并或退出偏题薄内容，关闭自动广告并隐藏手动广告位，再申请复审。"
  },
  "isbn-ban-hao-publishing-number-system": {
    "title": "ISBN、书号与游戏版号体系调研：前世今生、获取路径与产业影响",
    "date": "2026-05-26",
    "section": "分析",
    "summary": "ISBN 原本是图书供应链的标准化识别码；在中国语境下，它与出版许可、内容审读、CIP、电子出版物管理和网络游戏审批叠加，形成了「标识 + 准入 + 审查 + 流通」一体化体系。游戏之所以也有 ISBN，是因为法规把网络游戏纳入网络出版物 / 电子出版物管理。"
  },
  "content-taxonomy-governance-methods": {
    "title": "内容分类为何越分越乱：一次个人站返工与可持续治理方法",
    "date": "2026-07-31",
    "section": "内容创作",
    "summary": "分类混乱通常源于多个维度挤在同一组标签中，以及系统推断、筛选逻辑和卡片展示使用了不同口径。可持续方案需要分开管理内容类型、主题、研究对象、交付方式和编辑状态；主题使用稳定 ID、首选名称、别名、定义与纳入排除边界；人工标注优先，算法推断只用于迁移和发现待治理内容。"
  },
  "openclaw-2026-8-1": {
    "title": "OpenClaw 2026.8.1 节点：迁移、记忆默认与权限边界",
    "date": "2026-08-31",
    "section": "AI 与开发",
    "summary": "2026.8.1 的工程重点是跨设备会话、默认可改的记忆策略和可审计权限。升级当时应先跑 doctor 处理 OpenProse 与 OpenAI 路由。现行 tip 已推进到 v2026.10.10（GitHub Releases，2026-11-03 UTC）。这份记录是节点档案，不要把 8.1 数字当成当前产品态。"
  },
  "openclaw-agent-sms-twilio-flow": {
    "title": "国外 OpenClaw 类智能体如何接 SMS：Twilio 流程、绑定认证、号码通道与国际短信分析",
    "date": "2026-07-07",
    "section": "分析",
    "summary": "国外 OpenClaw 类智能体接短信，本质是把 Agent 的 channel 接到 Twilio 这类 CPaaS：买/接入可发短信的号码，配置 Messaging Service 或号码 webhook，出站调用 Messages API，入站校验 X-Twilio-Signature，再把手机号和站内用户绑定。美国号码要重点处理 A2P 10DLC、免费号验证或短码；国际短信要开 Geo Permissions，并逐目的国看 sender 类型与合规。"
  },
  "openclaw-channel-official-integration": {
    "title": "如何让一个 channel 被 OpenClaw 官方集成：调研——四档分发机制与贡献路径",
    "date": "2026-06-24",
    "section": "分析",
    "summary": "OpenClaw 的 channel 就是插件。做出来不难（manifest + 契约 + 发 ClawHub），难的是「被官方集成」——官方明说「多数功能不接受、应做第三方插件」。四档分发：核心原生 / bundled（随核心发行）/ 官方外部 / 社区；想进 bundled 实质条件是有领域 maintainer 愿意接管维护，飞书就是这么进的。"
  },
  "openclaw-mainstream-adoption-reality-check": {
    "title": "OpenClaw 主流采用现实检验：高星标不等于主流产品",
    "date": "2026-06-09",
    "section": "产品与体验",
    "summary": "可核验：GitHub 星标约 39 万级、fork 约 8 万级（API 当日快照）；Skills / 多渠道自托管定位清晰；安全评测有第三方快照但日期绑定。不可核验：全球安装数、日活、是否已成「普通人默认助手」。腾讯侧 QClaw → WorkBuddy 迁移说明大厂会借生态，但不是 OpenClaw 已主流化的证明。采用结论应写成「开发者与自托管圈层高可见」，不是「已主流」。"
  },
  "openclaw-sms-provider": {
    "title": "OpenClaw 的短信（SMS）能力由谁提供：调研——官方内置 Twilio channel，Telnyx 与社区补位",
    "date": "2026-06-24",
    "section": "分析",
    "summary": "「OpenClaw 的短信」现在有官方答案：核心仓库内置的 `@openclaw/sms` channel 默认走 Twilio（2026-05-31 加入、随 2026.6.10 发行）。Telnyx 是另一条由 Telnyx 公司自建的一方 channel；要 Agent 主动外发的 skill、以及更省/托管路线，则靠生态。判断落在「内置默认 vs 自选 vs 社区」「channel vs skill」上。"
  },
  "openclaw-twilio-three-integration-paths": {
    "title": "OpenClaw 接入 Twilio 的三条路线：SMS、Voice Call 与 Agent Connect 怎么选",
    "date": "2026-09-01",
    "section": "AI 与开发",
    "summary": "已经使用 OpenClaw、只想增加短信对话，选择 @openclaw/sms；需要让 OpenClaw 打电话、接电话，选择 @openclaw/voice-call；准备自建面向客户的 Python AI Agent，并需要 SMS、语音、WhatsApp、RCS、Chat、持久记忆和人工转接，选择 Twilio Agent Connect。SMS 只传输应用提交的正文，默认不会自行读取模型推理；OpenClaw 开启 /reasoning on 后，模型提供的 reasoning 可能作为额外消息发送，因此生产环境应保持关闭。"
  },
  "imessage-openclaw-channel": {
    "title": "用 iMessage 驱动 OpenClaw（龙虾）调研：渠道架构、权限模型与踩坑清单",
    "date": "2026-06-23",
    "section": "分析",
    "summary": "iMessage 渠道的本质是「一台已登录 Messages 的 Mac + imsg CLI + OpenClaw Gateway」三件套：Gateway 起 imsg rpc 子进程，JSON-RPC 走 stdio，读消息靠直接读 ~/Library/Messages/chat.db（需 Full Disk Access），发消息靠 Messages.app 的公共 AppleScript 接口（需 Automation 权限），二者都不依赖私有 API；只有 react/编辑/撤回/建群这类进阶动作才需要关 SIP + 注入 dylib，是真实的安全代价。它能跑，但脆弱点集中在「权限按进程上下文授予」——LaunchAgent/Login Item 起的进程拿不到 FDA、macOS 26 上 imsg send 可能静默失败。判断：想要「发条短信就驱动 agent」的体验，值得在一台专用 Mac 上跟进自建；想要稳定对外服务或无 Mac 环境，现阶段观望。以上为外部观察，非承诺或建议。"
  },
  "agent-communications-skills-channels-july-growth": {
    "title": "七月底智能体通信生态快照：Skills 约 150 万，OpenClaw 主包月下载约 1056 万",
    "date": "2026-08-11",
    "section": "AI 与开发",
    "summary": "通信 Skills 从 6 月初到 7 月 27 日约增长 25%。npm 侧需要分开看：官方 openclaw 主包滚动 30 天下载为 1055.6 万，API 可观测累计 4897.1 万；同一官方仓库内可单独统计的通信 Channel 子包约 80.1 万，较 6 月初同口径下降约 4%。原“Channel 约 130 万、增长约 30%”混入延伸版本后无法代表 OpenClaw 官方仓库，已删除。"
  },
  "lobster-vs-doubao-phone-agent-divide": {
    "title": "从王自如\"两大妥协\"出发：龙虾 (OpenClaw) 与豆包手机背后的电脑/手机 Agent 分野",
    "date": "2026-06-11",
    "section": "AI 与开发",
    "summary": "王自如的\"两大妥协\"框架在桌面端解释力较强；手机端真正卡住豆包的是微信 / 银行 / 阿里系应用集体识别并拒绝 AI 操作后形成的\"平台主权墙\"。电脑和手机的本质差异不在屏幕大小，而在\"谁有权力替用户决定开放哪些权限给 Agent\"。这只是一种外部观察解读，不代表当事人或厂商的真实定位与战略。"
  }
}

const ARCHIVE_PUBLIC = {
  'openclaw-pr-anthropic-image-normalization': {
    title: '6 次被 OpenClaw 合并：从修一个提示，到修一条完整链路',
    date: '2026-08-15',
    section: '开源贡献',
    summary: '对 openclaw/openclaw 上 6 个已合并 PR（#90517/#98320/#91553/#102537/#113200/#120104）做 2026-11-04 GitHub API 复核：合并态、merge_commit_sha、关联 issue 与 PR 标签均可核对。按时间线归纳贡献从可行动错误提示扩展到 provider / 入站结算链路；ClawSweeper 只保留仍可在 labels 上复核的评级。',
  },
  'mcp-https-vs-stdio-architecture-design': {
    title: 'MCP 走 HTTPS 还是 stdio：两种传输方式背后的架构与业务设计',
    date: '2026-07-17',
    section: 'AI 工程',
    summary: 'MCP 的 HTTPS 与 stdio 分别对应网络服务边界与本机进程边界两套架构。可从生命周期、鉴权、状态、扩缩容、安全、可观察性和业务场景出发，完成选型与混合设计。',
  },
  'ai-project-complexity-governance': {
    title: 'AI 能写完代码以后，复杂度成了真正的瓶颈',
    date: '2026-07-17',
    section: 'AI 工程',
    summary: 'AI 降低了生产代码的成本，却没有降低理解系统的成本。以这个网站为例，讨论数据库范式、分层抽象、数据拆分、算法优化与 AI 协作边界，尝试给出一套让复杂系统重新可控的方法。',
  },
}

function researchLead(slug, group = 'essay') {
  const item = RESEARCH_PUBLIC[slug]
  return {
    href: `/articles/research/topics/${slug}`,
    label: item.title,
    note: item.summary,
    date: item.date,
    section: item.section,
    group,
  }
}

function archiveLead(slug, group = 'essay') {
  const item = ARCHIVE_PUBLIC[slug]
  return {
    href: `/articles/${slug}`,
    label: item.title,
    note: item.summary,
    date: item.date,
    section: item.section,
    group,
  }
}

function bookLead(href) {
  const book = PUBLISHED_WORKS.find((item) => item.href === href)
  const credit = [book.author, book.publisher, book.year, book.status].filter(Boolean).join('，')
  return {
    href,
    label: book.title,
    note: `${book.description} ${credit}。`,
    date: book.year,
    section: book.type,
    group: 'record',
  }
}

function toolLead(href) {
  const tool = TOOL_ITEMS.find((item) => item.href === href)
  const type = TOOL_TYPE_META.find((item) => item.id === tool.type)
  return {
    href,
    label: tool.title,
    note: tool.summary,
    date: tool.updatedAt,
    section: `${type.title} · ${TOOL_STATUS_META[tool.status] || tool.status}`,
    group: 'entry',
  }
}

function pageLead({ href, label, note, date = '', section, group }) {
  return { href, label, note, date, section, group }
}

export const TOPIC_HUBS = {
  'ai-agents': {
    slug: 'ai-agents',
    path: '/topics/ai-agents',
    title: 'AI 智能体',
    kicker: '主线',
    description: '智能体实践总入口。收录记忆机制、工具协议、Agent Loop、MCP，以及能在真实环境里跑起来的接入和贡献。完整篇目在 AI 与开发目录。',
    standing: 'OpenClaw 改动已合并进主分支，书目在著作。',
    leads: [
      researchLead('agent-memory-mechanisms'),
      researchLead('vibe-coding-judgment-structure'),
      researchLead('agent-loop-why-now'),
      researchLead('chat-to-agent-loop-anthropic-practice'),
      researchLead('mcp-2026-07-28-stateless-protocol'),
      researchLead('office-agent-mcp-unified-authorization-architecture'),
      archiveLead('mcp-https-vs-stdio-architecture-design'),
      researchLead('multi-agent-frameworks-comparison'),
      researchLead('15-minutes-understand-large-language-models'),
      researchLead('workbuddy-skill-channel-architecture'),
      researchLead('cloudflare-edge-agents-practice'),
      archiveLead('ai-project-complexity-governance'),
      researchLead('openclaw-repo-snapshot-pr-guide'),
      archiveLead('openclaw-pr-anthropic-image-normalization'),
      pageLead({
        href: '/topics/openclaw',
        label: 'OpenClaw',
        note: 'OpenClaw 总入口：已合并到主分支的贡献、提 PR 的做法，以及渠道、短信和版本节点。',
        section: '主线',
        group: 'record',
      }),
      bookLead('/books/llm-underlying-logic'),
      bookLead('/books/ai-bots-guide'),
      pageLead({
        href: '/articles?subject=ai_dev',
        label: 'AI 与开发目录',
        note: '模型、Agent、AI 编程与工具的完整目录，可按栏目继续筛选。',
        section: '目录',
        group: 'entry',
      }),
      pageLead({
        href: '/topics/frontend-cloud',
        label: '前端与云',
        note: '前端与云工程总入口：Next.js、Cloudflare，以及这台站点的架构、发布和复盘。',
        section: '主线',
        group: 'entry',
      }),
      pageLead({
        href: '/topics/books',
        label: '著作',
        note: '著作总入口：已出版图书和电子小册，馆藏在图书馆。',
        section: '主线',
        group: 'entry',
      }),
      pageLead({
        href: '/resources/edge-agent-development',
        label: '边缘智能体开发实战',
        note: '从 Agent 原型到 Cloudflare 边缘 SaaS 的 16 节工程化学习路线与课程目录。',
        section: '资源',
        group: 'entry',
      }),
      pageLead({
        href: '/resources/ai-learning-library',
        label: 'AI 学习资料',
        note: '按机器学习、深度学习、自然语言处理、计算机视觉、推荐系统和数据分析整理的 AI 学习书目与资料入口。',
        section: '资源',
        group: 'entry',
      }),
      toolLead('/tools/workbuddy-acp-bridge'),
      toolLead('/tools/openclaw-pr-helper'),
      toolLead('/web-llm'),
    ],
  },
  'frontend-cloud': {
    slug: 'frontend-cloud',
    path: '/topics/frontend-cloud',
    title: '前端与云工程',
    kicker: '主线',
    description: '前端与云工程总入口。收录 Next.js、Cloudflare Workers、D1 额度与缓存，以及这台站点的架构、鉴权、发布和复盘。',
    standing: '这台站点跑在 Next.js 与 Cloudflare 上。',
    leads: [
      researchLead('nextjs-cloudflare-performance-optimization'),
      researchLead('cloudflare-edge-agents-practice'),
      researchLead('cloudflare-d1-free-tier-limit-enforcement'),
      researchLead('cloudflare-d1-vs-supabase'),
      researchLead('cloudflare-free-paid-service-boundaries'),
      researchLead('cloudflare-agent-setup-mcp-skills'),
      researchLead('d1-edge-cache-configurable-ranbi'),
      researchLead('resend-email-otp-cloudflare-d1'),
      researchLead('generic-permission-system-cloudflare-redis'),
      researchLead('2aran-owner-auth-practice'),
      researchLead('local-agent-ops-launchd-cloudflare-tunnel'),
      researchLead('june-2026-site-retrospective'),
      researchLead('july-2026-site-retrospective'),
      researchLead('google-adsense-low-value-content-rejection'),
      pageLead({
        href: '/articles?subject=web_cloud',
        label: 'Web 与云目录',
        note: '前端、架构、网络与平台的完整目录。',
        section: '目录',
        group: 'entry',
      }),
      pageLead({
        href: '/articles?subject=site_engineering',
        label: '站点工程目录',
        note: '2aran.com 的架构、发布、运维与复盘的完整目录。',
        section: '目录',
        group: 'entry',
      }),
      pageLead({
        href: '/frontend-weekly',
        label: '前端周看',
        note: '前端周刊、AI 每日精选与每时新闻，持续自动同步更新。',
        section: '目录',
        group: 'entry',
      }),
      pageLead({
        href: '/changelog',
        label: '更新记录',
        note: '从 git 提交历史归纳的 2aran.com 站点更新，可按周、月、季度和年度查看。',
        section: '目录',
        group: 'entry',
      }),
      pageLead({
        href: '/topics/ai-agents',
        label: 'AI 智能体',
        note: '智能体实践总入口：记忆、工具协议、Agent Loop，以及真实环境里的接入。',
        section: '主线',
        group: 'entry',
      }),
      toolLead('/web-llm'),
    ],
  },
  books: {
    slug: 'books',
    path: '/topics/books',
    title: '著作',
    kicker: '主线',
    description: '著作总入口。已经出版的图书和电子小册各有自己的页面，馆藏在图书馆。',
    standing: '已出版图书、电子小册和站内可读资源，目录在图书馆。',
    leads: [
      bookLead('/books/seedance-guide'),
      bookLead('/books/llm-underlying-logic'),
      bookLead('/books/programmer-growth-notes'),
      bookLead('/books/ai-bots-guide'),
      researchLead('15-minutes-understand-large-language-models'),
      researchLead('isbn-ban-hao-publishing-number-system'),
      pageLead({
        href: '/resources/books',
        label: '图书馆',
        note: '出版图书、电子小册、指南手册与其他原创资源，和外部作者的原著、白皮书分区陈列。',
        section: '资源',
        group: 'entry',
      }),
      pageLead({
        href: '/resources/ai-learning-library',
        label: 'AI 学习资料',
        note: '按机器学习、深度学习、自然语言处理、计算机视觉、推荐系统和数据分析等方向整理的 AI 学习书目与资料入口。',
        section: '资源',
        group: 'entry',
      }),
      pageLead({
        href: '/topics/ai-agents',
        label: 'AI 智能体',
        note: '智能体实践总入口。收录记忆、工具协议、Agent Loop，以及模型、RAG、MCP 与智能体的相关文章。',
        section: '主线',
        group: 'entry',
      }),
    ],
  },
  openclaw: {
    slug: 'openclaw',
    path: '/topics/openclaw',
    title: 'OpenClaw',
    kicker: '主线',
    description: 'OpenClaw 总入口。收录已经合并进主分支的改动、外部贡献者把补丁送到 main 的做法，以及渠道、短信和版本节点的相关文章。',
    standing: '贡献记录只收已经合并进 OpenClaw 主分支的改动。',
    leads: [
      archiveLead('openclaw-pr-anthropic-image-normalization'),
      researchLead('openclaw-repo-snapshot-pr-guide'),
      researchLead('openclaw-2026-8-1'),
      researchLead('openclaw-channel-official-integration'),
      researchLead('openclaw-mainstream-adoption-reality-check'),
      researchLead('openclaw-sms-provider'),
      researchLead('openclaw-agent-sms-twilio-flow'),
      researchLead('openclaw-twilio-three-integration-paths'),
      researchLead('imessage-openclaw-channel'),
      researchLead('agent-communications-skills-channels-july-growth'),
      researchLead('lobster-vs-doubao-phone-agent-divide'),
      pageLead({
        href: '/about#openclaw-contributions',
        label: '合并记录',
        note: `列出 ${OPENCLAW_ACHIEVEMENT_COUNT} 个已合并到 OpenClaw main 的 PR，每条记录链到公开 PR。`,
        section: '开源贡献',
        group: 'record',
      }),
      pageLead({
        href: '/topics/ai-agents',
        label: 'AI 智能体',
        note: '智能体实践总入口：记忆、工具协议、Agent Loop，以及和 OpenClaw 相邻的接入文章。',
        section: '主线',
        group: 'entry',
      }),
      toolLead('/tools/openclaw-pr-helper'),
      pageLead({
        href: '/articles?subject=ai_dev',
        label: 'AI 与开发目录',
        note: '模型、Agent、AI 编程与工具的完整目录。',
        section: '目录',
        group: 'entry',
      }),
    ],
  },
  editorial: {
    slug: 'editorial',
    path: '/topics/editorial',
    title: '内容说明',
    kicker: '主线',
    description: '内容说明总入口。汇集作者责任、选题范围、核对、修订、更正和 AI 协助的完整说明、帮助摘要和提交入口。',
    standing: '作者、选题、核对、更正和 AI 协助。',
    leads: [
      researchLead('content-taxonomy-governance-methods'),
      pageLead({
        href: '/editorial',
        label: '完整说明',
        note: '内容由涂阿燃（TUARAN）定题、选材并确认。说明选题范围、人工核对、修订路径、AI 协助，以及金融与健康内容的边界。',
        section: '说明',
        group: 'entry',
      }),
      pageLead({
        href: '/about',
        label: '关于涂阿燃',
        note: `履历、已出版作品，以及 ${OPENCLAW_ACHIEVEMENT_COUNT} 个已合并到 OpenClaw main 的 PR。微信 ${wechat.value}。`,
        section: '说明',
        group: 'entry',
      }),
      pageLead({
        href: '/help#editorial',
        label: '帮助里的规则摘要',
        note: '作者责任、工具使用、来源、安全边界和修订规则的帮助摘要，和完整说明使用同一套边界。',
        section: '规则',
        group: 'record',
      }),
      pageLead({
        href: '/contact',
        label: '提交更正',
        note: `合作、内容更正和日常交流加微信 ${wechat.value}。账号、隐私和需要留档的事项发邮件 ${email.value}。提交更正时附页面网址、段落和可核验来源。`,
        section: '规则',
        group: 'record',
      }),
      pageLead({
        href: '/help',
        label: '站点帮助',
        note: '按主题列出领取、账号、规则和联系。内容说明的规则摘要在帮助页「内容说明」一节。',
        section: '说明',
        group: 'entry',
      }),
      pageLead({
        href: '/articles?subject=content_creation',
        label: '内容创作目录',
        note: '按「内容创作」主题浏览的完整目录。',
        section: '目录',
        group: 'entry',
      }),
    ],
  },
}

export const TOPIC_HUB_LIST = Object.values(TOPIC_HUBS)

export function getTopicHub(slug) {
  return TOPIC_HUBS[slug] || null
}
