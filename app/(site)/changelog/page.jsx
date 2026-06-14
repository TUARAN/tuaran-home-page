export const dynamic = 'force-static'

export const metadata = {
  title: '站点更新记录 · 2aran.com',
  description: '从 git 提交历史归纳而来的 2aran.com 站点周更记录，按自然周整理版本、功能演进与内容建设。',
  alternates: { canonical: '/changelog' },
}

const changelog = [
  {
    version: 'v2026.25',
    week: '2026-W24',
    range: '2026-06-10 起',
    commits: 84,
    title: '后台管理收束、首页封面化与文章页筛选修正',
    summary:
      '把分散在 /agent-ops/* 的站长控制台收束为 /admin/* 统一入口，同时继续打磨首页封面、经典样式、文章页筛选和合作入口文案。',
    planned: [
      '阶段 2：Cloudflare Pages 绑定 admin.2aran.com 自定义域（middleware 分流逻辑已就绪）。',
      '阶段 2（可选）：为 admin 子域加 Cloudflare Access，与 ops.2aran.com 对齐。',
      '阶段 3 · 暂缓：内容 CMS、独立 repo、RBAC；内容发布继续 git + deploy；ops.2aran.com 保持外部执行引擎。',
    ],
    done: [
      '新增 /admin Dashboard：聚合 D1 健康、Ops 探活与各管理台入口。',
      '落地 (admin) route group 独立 layout：无公开站导航，仅 Theme + Session + AdminShell。',
      '旧 /agent-ops/* 301 至 /admin/*；siteNav、robots 与 ai-projects 链接同步更新。',
      '抽 lib/adminAuth 统一 /api/admin/* owner 校验；middleware 支持 admin.2aran.com Host 分流。',
      '首页新增潮流 / 经典两套样式：潮流使用横幅视觉和随机推荐卡，经典还原日志式首页布局。',
      '压缩广州城市横幅图并接入首页；推荐卡改为可随机切换博主联盟、前端周看和 PublishLab。',
      '统一样式切换与阅读底色：潮流默认雾粉城景，经典默认冷牙白，刷新首屏不再误清经典底色。',
      '文章页筛选区改为可展开面板，并按当前反馈默认展开；PC 与移动端都保留当前筛选摘要。',
      '继续微调紫色主题下的首页控件和文章页筛选区，让不同阅读底色下的边框、按钮和标签更统一。',
      '修正首页随机推荐卡标签，把入口名称与产品定位对齐。',
      '重写首页联系和合作页开头文案，减少自我解释，直接说明合作、交流和订阅入口。',
      '同步加密记忆快照，新增 wrangler 代理规避记录，便于后续运维排查复用。',
    ],
  },
  {
    version: 'v2026.24',
    week: '2026-W24',
    range: '2026-06-06 至 2026-06-08',
    commits: 24,
    title: '产品组合、文章发现和公开写接口安全收口',
    summary: '这一轮把首页从社交展示继续收敛为产品组合入口，同时补强文章索引、合作说明和公开写接口的滥用防护。',
    items: [
      '首页主入口聚焦三个长期产品：博主联盟、前端周看、PublishLab，并移除关注矩阵和最新动态等干扰模块。',
      '文章页新增阅读起点，把最新内容、推荐调研和代表作品前置；分类筛选从多 tab 降噪为“调研”一级入口 + 调研类型二级筛选。',
      '新增 3 篇 6 月调研：Codex 接入 DeepSeek、广柳长迁居比较、全球育儿负担量化，并同步更新研究索引。',
      '合作页从强报价页改为克制的合作说明，补充合作范围、边界、样本链接和三个长期项目入口。',
      '公开写接口加入滥用防护：短链拦截本地 / 私网目标，短链、评论、踩踏接口加入 D1 限流表，并补充线上迁移提醒。',
      'OAuth callback 不再向前端透出第三方原始失败详情，改为服务端脱敏日志 + 稳定错误码；同时补齐环境变量样例。',
      '主导航文案改为“读文章 / 看项目 / 来合作 / 关于我”，并把 PublishLab 提升到和博主联盟、前端周看同级的产品入口。',
    ],
  },
  {
    version: 'v2026.23',
    week: '2026-W23',
    range: '2026-06-01 至 2026-06-05',
    commits: 58,
    title: '工程作品、富页面调研和导航体系成型',
    summary: '这一周站点从“内容列表”继续升级为带项目、资料、调研、私域和更新记录的个人知识产品。',
    items: [
      '重排首页与主导航，把内容分成专栏、调研、资料，并把项目频道调整为 AI 系统、工程作品、生活工具三组。',
      '新增 /works 工程作品页，推出癌症全景、Cloudflare × VoidZero vs Vercel × Next 研判、Skill 市场调研等富数据页面。',
      '重做 /cancers-overview：从卡片列表改为散点、排行、对比、焦点模式和中国视角，沉淀为富数据调研页 Skill。',
      '新增 /platform-framework-pairs，围绕 2026-06-04 Cloudflare 收购 VoidZero 做平台框架配对研判，并补齐分享传播结构。',
      '扩展调研知识库：新增 Cloudflare Edge Agents、Resend + D1 邮件 OTP、OpenClaw 仓库快照、CUDA / RTX Spark、Multiable、ERP 推广模型、当年明月人物调研等。',
      '上线长期罗盘与上下文记忆：加密私域记录、时间线视图、主题筛选、Markdown 渲染、只读 API 和记忆快照归档。',
      '完善账号与私域体验：加入 email auth、精简登录弹窗、私密页面改成 private vault 语义，弱化无关 Login / Owner 标签。',
      '把“站点更新记录”提升为顶部独立图标入口，用周更方式公开本站持续迭代进度。',
    ],
  },
  {
    version: 'v2026.22',
    week: '2026-W22',
    range: '2026-05-25 至 2026-05-31',
    commits: 107,
    title: '知识库进入高频生产期',
    summary: '这是站点建设最密集的一周，重点从单页展示转向知识库、研究工作流、AI 专题和内容分发能力。',
    items: [
      '重建 /web-llm 为端侧模型实验室，补齐跨源隔离、模型源探测和本地模型体验。',
      '调研系统加入多版本正文、URL 状态保持、PPT 导出、图片嵌入、PV 统计和评论能力。',
      '新增多篇研究内容，覆盖飞连 Agent 面试、Qwen Agent、ISBN、中间件、Vibe Coding、IP 消息、SEO/GEO、张居正写作项目等。',
      '知识库首页加入创作日历、搜索、掘金活动热力图、静态快照和重点条目折叠展示。',
      '完善专题页体系：写作变现、AI Token 使用、日月运行可视化，并给专题页统一加入分享按钮。',
    ],
  },
  {
    version: 'v2026.21',
    week: '2026-W21',
    range: '2026-05-18 至 2026-05-24',
    commits: 36,
    title: '知识库产品化',
    summary: '研究内容从文章列表升级为可筛选、可复制、可加密、可分发的内容系统。',
    items: [
      '把外部站点审查建议落到首页、服务页、转化路径和 SEO 结构中。',
      '调研详情页加入 TL;DR、阅读时长、事项二级类型、Markdown 复制和密码加密。',
      '新增儒释道、中国政治体制等专题页，并接入知识库事项调研分类。',
      '扩展 YouTube 收藏、LLM 教程、语音记事和研究分发工作流。',
      '修复 Web LLM 国内模型源、移动端关于页、研究列表标题溢出和旧域名 canonical。',
    ],
  },
  {
    version: 'v2026.20',
    week: '2026-W20',
    range: '2026-05-11 至 2026-05-17',
    commits: 19,
    title: 'research 目录和知识库正式成型',
    summary: '站点从个人主页进一步转向结构化知识库，新增研究目录、公司调研和统一文章入口。',
    items: [
      '新增 research/ 调研目录，并把 /articles 改为按 Tab 整合原创与调研内容。',
      '批量新增公司调研、洗碗机市场调研，并优化调研详情代码块样式。',
      '加入 OG 动态图、GitHub Actions CI、webmanifest 修复和 sitemap 结构优化。',
      '锁定 transformers 版本、压缩 Twitter 图片，降低构建和资源风险。',
      '对路由做 ABCD 收敛，删除独立人物收藏入口，统一纳入知识库。',
    ],
  },
  {
    version: 'v2026.19',
    week: '2026-W19',
    range: '2026-05-06 至 2026-05-10',
    commits: 20,
    title: '性能、SEO 与生活工具扩展',
    summary: '集中处理 Web LLM 性能、SEO 覆盖、图片资源和家庭生活工具。',
    items: [
      'Web LLM 流式输出改为 rAF 批量刷新，并从独立 demo 进行 1:1 移植。',
      '扩展 sitemap 静态路由、补齐 canonical，清理重复 Umami 和占位验证 meta。',
      '压缩阅读封面并删除孤立资源，减少 public 资源体积。',
      '小茉莉日常合并专注、习惯、妈妈锻炼和宝宝记录。',
      '新增吃什么 H5 点菜页、上下文记忆页，并继续打磨首页定位。',
    ],
  },
  {
    version: 'v2026.18',
    week: '2026-W18',
    range: '2026-04-28',
    commits: 9,
    title: '站点工具箱上线',
    summary: 'AI 项目区开始承载实用工具，短链能力从第三方切换为自托管。',
    items: [
      '新增 site-tools 面板和 D1 支持的 URL shortener。',
      '实现 tuaran.me/{code} 自托管短链跳转，移除 TinyURL 依赖。',
      '前端周刊正式更名为前端下一步 Frontend Next。',
      'Web LLM 加入懒加载站点上下文、加载门控和 warmup 优化。',
    ],
  },
  {
    version: 'v2026.17',
    week: '2026-W17',
    range: '2026-04-20 至 2026-04-24',
    commits: 22,
    title: '家庭应用和首页叙事并行推进',
    summary: '首页继续降噪，小茉莉日常从页面原型发展成带登录、同步和统计的家庭工具。',
    items: [
      '首页增加近期片段模块，调整身份文案、头像层级和纸感色调。',
      '小茉莉日常加入 H5 checklist、GitHub 登录、D1 同步和日期选择。',
      '把每日进度改为柱状图看板，并增加 30 天滚动统计。',
      '删除旧 dad-checkin API 和表结构，日常记录改为更聚焦的待办模型。',
      '补充 Agent 能力分层、生产与消费等日记内容。',
    ],
  },
  {
    version: 'v2026.16',
    week: '2026-W16',
    range: '2026-04-16 至 2026-04-19',
    commits: 10,
    title: 'Web LLM 体验内嵌化',
    summary: '端侧大模型从独立页面入口变成首页可唤起的轻量体验，同时继续修首页移动端。',
    items: [
      'Web LLM 聊天改为 modal 打开，避免用户离开主站上下文。',
      '用 /web-llm/embed 替代 query 嵌入，修复 hydration 白屏。',
      '首页加入 vibe 7 天使用徽章，并简化主题切换视觉。',
      '统一多页面布局和样式，继续修首页移动端间距与导航。',
    ],
  },
  {
    version: 'v2026.15',
    week: '2026-W15',
    range: '2026-04-07 至 2026-04-08',
    commits: 3,
    title: '项目矩阵改为 AI Native 图谱',
    summary: '从列表式项目矩阵转向更强调 AI Native 关系的图谱表达。',
    items: [
      '修复首页构建失败，恢复被截断的页面组件。',
      '恢复 Open Claude Code 域名展示，并压缩战略文案。',
      '把项目矩阵替换为 AI Native graph layout。',
    ],
  },
  {
    version: 'v2026.14',
    week: '2026-W14',
    range: '2026-03-31 至 2026-04-04',
    commits: 11,
    title: '项目矩阵和浏览器 LLM 成型',
    summary: 'AI 项目区获得更明确的信息架构，浏览器端 LLM 开始进入站内体验。',
    items: [
      '项目分区统一为 tabbed matrix，并继续抛光首页 snap 布局。',
      '新增浏览器 LLM Q&A 页面和 web-llm runtime。',
      '修复 web-llm 入口导航，优化运行时体验。',
      '调整项目矩阵标题、实验项和布局细节。',
    ],
  },
  {
    version: 'v2026.13',
    week: '2026-W13',
    range: '2026-03-24 至 2026-03-26',
    commits: 4,
    title: '捐赠入口和项目展示整理',
    summary: '首页继续向个人站点门户靠拢，增加支持入口并梳理项目文案。',
    items: [
      '更新首页展示区和日记内容。',
      '细化首页 footer 与项目介绍文案。',
      '调整首页布局和项目列表。',
      '新增捐赠页，并接入首页入口。',
    ],
  },
  {
    version: 'v2026.12',
    week: '2026-W12',
    range: '2026-03-16 至 2026-03-20',
    commits: 10,
    title: '域名资产展示',
    summary: '把维护中的域名从普通链接升级为可解释的个人资产矩阵。',
    items: [
      '首页链接改为 maintained domains list，再升级为表格展示。',
      '加入域名策略 tooltip、域名数量 badge 和相关日记反思。',
      '持续修正文案标题与 tooltip 表达。',
      '优化 domain showcase 视觉层级。',
    ],
  },
  {
    version: 'v2026.11',
    week: '2026-W11',
    range: '2026-03-13 至 2026-03-15',
    commits: 11,
    title: '日记合并与矩联身份露出',
    summary: '周报被收敛进浮生日记，个人身份也开始明确加入矩联科技。',
    items: [
      '把 weekly 合并进 /diary，并为旧路径加入 301 redirect。',
      '首页 sidebar 顺序调整，友链和工具箱重新排布。',
      '关于模块加入矩联科技职务信息，并调整身份标签。',
      '新增第 11 周周记，更新首页日期与友链展示。',
    ],
  },
  {
    version: 'v2026.10',
    week: '2026-W10',
    range: '2026-03-02 至 2026-03-06',
    commits: 3,
    title: '社群和友链增强',
    summary: '站点开始强化人与人连接的入口，社群、扫码和友链变得更明显。',
    items: [
      'footer 友链卡片加入动效。',
      '更新社群介绍页、扫码交友和进社群链接。',
      '继续维护周报相关首页内容。',
    ],
  },
  {
    version: 'v2026.09',
    week: '2026-W09',
    range: '2026-02-23 至 2026-03-01',
    commits: 7,
    title: '人物专题和周报扩展',
    summary: '内容区继续向人物、时间线和周记方向扩张。',
    items: [
      '新增 2008 时间线收藏笔记。',
      '新增 Elon Musk 沉浸式人物页，并修剪页面文案。',
      '更新 README 和第 8-10 周周报内容。',
      '补充软件架构分层重排相关周记。',
    ],
  },
  {
    version: 'v2026.07',
    week: '2026-W07',
    range: '2026-02-10 至 2026-02-13',
    commits: 18,
    title: '资源库分类完善',
    summary: '读书、收藏、人物资源进一步被整理，Twitter 收藏获得分类筛选能力。',
    items: [
      '首页 sidebar、身份标签、header marquee 和关于页侧栏继续微调。',
      '新增富人与穷人思维表、资产表现图、计算机知识树、明代语录等收藏。',
      '新增 Tauri 入门资源目录，并更新微信二维码。',
      'Twitter 收藏加入分类与即时筛选。',
    ],
  },
  {
    version: 'v2026.06',
    week: '2026-W06',
    range: '2026-02-02 至 2026-02-06',
    commits: 12,
    title: '读书与收藏布局统一',
    summary: '读书页、收藏页和 weekly 内容进行一轮统一整理。',
    items: [
      '更新书签和读书页面，并补充 leverage 摘录。',
      '优化读书金字塔交互。',
      '调整账号、身份标签、header 间距等小型文案和样式。',
      '新增 weekly 栏目与第 6 周周报，统一收藏页 TOC 布局。',
    ],
  },
  {
    version: 'v2026.05',
    week: '2026-W05',
    range: '2026-01-30 至 2026-02-01',
    commits: 5,
    title: '收藏页上线',
    summary: '站点从文章与读书继续扩展到资源收藏。',
    items: [
      '修复 indexing 和外链标记。',
      '优化 UI 与首页身份标签。',
      '新增 bookmarks 页面，并统一读书和收藏页头部与返回链接。',
    ],
  },
  {
    version: 'v2026.04',
    week: '2026-W04',
    range: '2026-01-19 至 2026-01-23',
    commits: 30,
    title: 'AI 人物志密集建设',
    summary: '站点内容进入人物专题阶段，AI 先驱相关页面和文章渲染能力持续增强。',
    items: [
      '更新读书导航、首页介绍、个人介绍统计和读书内容。',
      '日记新增社区生命周期条目，文章支持行内加粗、分段标题和外链标签。',
      '新增 AI 人物传记区域，并重组 TOC、时间线和头像展示。',
      '扩展 AI 时间线节点，补充 Yoshua Bengio 等人物内容。',
    ],
  },
  {
    version: 'v2026.03',
    week: '2026-W03',
    range: '2026-01-13 至 2026-01-16',
    commits: 12,
    title: '读书与历史频道打开',
    summary: '读书、历史、人物和诗词类内容开始形成稳定页面。',
    items: [
      '浮生日记增加日期小标题。',
      '新增 reading 路由、历史页面，并扩展明清帝王表。',
      '补充苏轼传记表格、读书页引文和格言 TOC。',
      '加入 favicon 资源，改进 metadata、sitemap 和图片 SEO。',
    ],
  },
  {
    version: 'v2026.02',
    week: '2026-W02',
    range: '2026-01-05 至 2026-01-09',
    commits: 20,
    title: '登录、留言和暗色模式',
    summary: 'Next.js 站点开始接入账号能力、留言面板、日记与主题切换。',
    items: [
      '加入主题/语言切换并抛光暗色模式。',
      '新增日记文章，修复内部文章路由。',
      '接入 GitHub 登录、stomp 面板、Cloudflare Pages 与 D1。',
      '修复 OAuth、Pages env、nodejs_compat 和输出目录相关部署问题。',
      '新增博主联盟/矩联文章，并调整 toolbox 状态。',
    ],
  },
  {
    version: 'v2026.01',
    week: '2026-W01',
    range: '2025-12-29 至 2026-01-04',
    commits: 14,
    title: '迁移到 Next.js',
    summary: '旧 Vue 站点被精简迁移到 Next.js，站点进入现在的工程框架。',
    items: [
      '迁移到 Next.js，瘦身首页，并删除旧 Vue 构建文件。',
      '新增公众号二维码区、文章页和动态链接。',
      '改进 SEO metadata 与 sitemap。',
      '加入 Umami 统计与流量看板，恢复图书推广块。',
    ],
  },
  {
    version: 'v2025.37',
    week: '2025-W37',
    range: '2025-09-09',
    commits: 1,
    title: '现代化 UI 重构',
    summary: '完成一次整体视觉重构，让站点从早期实验页面转向更现代的个人主页。',
    items: ['重构网站设计，统一现代化 UI 界面。'],
  },
  {
    version: 'v2025.36',
    week: '2025-W36',
    range: '2025-09-01',
    commits: 1,
    title: '个人介绍 Banner 整合',
    summary: '把头像、姓名、slogan 和社交按钮整合为更完整的首屏身份模块。',
    items: ['重构个人介绍 Banner，优化布局和视觉效果。'],
  },
  {
    version: 'v2025.35',
    week: '2025-W35',
    range: '2025-08-31',
    commits: 1,
    title: '第一性原则重构',
    summary: '站点内容被重新聚焦到个人介绍、项目列表、文章列表和加群入口。',
    items: ['按第一性原则重构网站，删减分散模块，保留核心转化路径。'],
  },
  {
    version: 'v2025.32',
    week: '2025-W32',
    range: '2025-08-04 至 2025-08-10',
    commits: 8,
    title: '导航和关于页出现',
    summary: '站点开始具备更完整的信息架构，About 页面首次上线。',
    items: [
      '更新社群二维码和轮播组件。',
      '重新设计 navbar，并新增 About 页面。',
      '优化个人主页信息面板，删除冗余技术专利文案。',
      '尝试更强动效、渐变背景和项目按钮风格。',
    ],
  },
  {
    version: 'v2025.31',
    week: '2025-W31',
    range: '2025-07-29 至 2025-07-31',
    commits: 4,
    title: '时间线和项目页打磨',
    summary: '早期首页重点围绕个人时间线、项目页和项目描述做视觉统一。',
    items: [
      '优化时间线位置、图标和成就徽章样式。',
      '项目页加入提示词项目，并整合网站与项目展示。',
      '更新 Projects.vue 中的项目描述。',
    ],
  },
  {
    version: 'v2025.30',
    week: '2025-W30',
    range: '2025-07-22 至 2025-07-27',
    commits: 11,
    title: '首页结构第一次扩张',
    summary: '首页开始加入时间线、博主联盟和外部项目入口，并同步收敛 footer。',
    items: [
      '重构首页设计，加入横向时间线和博主联盟按钮。',
      '调整介绍区块、二维码和左右布局。',
      '新增并随后调整大模型赋能交易入口，保留到开源项目页。',
      '页脚极简化，只保留版权信息。',
      '集成 stagewise toolbar，支持 AI 辅助编辑。',
    ],
  },
  {
    version: 'v2025.29',
    week: '2025-W29',
    range: '2025-07-14 至 2025-07-16',
    commits: 6,
    title: '音乐播放器和项目页重设计',
    summary: '早期站点开始加入更强的视觉风格和项目展示能力。',
    items: [
      '更新热门项目预览，加入代码矿工工具集合。',
      '优化主页布局和音乐播放器，并补充音频资源。',
      '重构 UI 为吉卜力风格，精简页面设计。',
      '重新设计 Projects 页面，展示已上线网站合集。',
    ],
  },
  {
    version: 'v2025.28',
    week: '2025-W28',
    range: '2025-07-07 至 2025-07-09',
    commits: 4,
    title: '个人站点雏形',
    summary: '最早的提交集中在页面性能、项目跳转和基础用户体验。',
    items: [
      '移除代码块和按钮动画，减少早期页面负担。',
      '加入项目跳转能力，并更新真实项目数据。',
      '优化网站功能、UI 设计、项目结构和用户体验。',
    ],
  },
]

const totalCommits = changelog.reduce((sum, item) => sum + item.commits, 0)
const latest = changelog[0]
const earliest = changelog[changelog.length - 1]

function ChangelogItemList({ items, markerClass }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-300">
          <span className={`mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChangelogSections({ entry }) {
  const usesSplitFormat = 'planned' in entry || 'done' in entry
  const doneItems = entry.done ?? entry.items ?? []
  const plannedItems = entry.planned ?? []

  if (!usesSplitFormat) {
    return <ChangelogItemList items={doneItems} markerClass="bg-[#aaae9c] dark:bg-[#536071]" />
  }

  return (
    <div className="mt-3 space-y-4">
      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b5a1f] dark:text-[#989e72]">
          已做
        </h3>
        {doneItems.length > 0 ? (
          <ChangelogItemList items={doneItems} markerClass="bg-emerald-500/80 dark:bg-emerald-400/80" />
        ) : (
          <p className="text-[13px] leading-6 text-[#858876] dark:text-[#8e9ab0]">（本周尚未交付）</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#767869] dark:text-[#8e9ab0]">
          计划
        </h3>
        {plannedItems.length > 0 ? (
          <ChangelogItemList items={plannedItems} markerClass="bg-[#c8cabb] dark:bg-[#4a5568]" />
        ) : (
          <p className="text-[13px] leading-6 text-[#858876] dark:text-[#8e9ab0]">（暂无后续计划）</p>
        )}
      </section>
    </div>
  )
}

export default function ChangelogPage() {
  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 py-8 md:py-10">
      <header className="border-b border-[#dee0db] pb-6 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          Site Changelog · 站点更新记录
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#15140f] dark:text-gray-100 md:text-3xl">
          按周记录这个站点如何长出来
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
          这份日志从 git 提交历史归纳而来，只记录活跃开发周。每个版本号对应一个自然周，例如 v2026.22
          表示 2026 年第 22 周。新版本条目分为「计划」与「已做」两块；较早条目仅保留已交付内容。
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['起点', earliest.range.split(' 至 ')[0]],
            ['最近', latest.range.split(' 至 ').at(-1)],
            ['活跃周', `${changelog.length} 周`],
            ['归纳提交', `${totalCommits} 次`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[#dfe0d8] bg-white/72 px-3 py-2 dark:border-[#232c36] dark:bg-[#121821]/72"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858876] dark:text-[#8e9ab0]">
                {label}
              </dt>
              <dd className="mt-1 text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <ol className="mt-8 space-y-4">
        {changelog.map((entry) => (
          <li
            key={entry.version}
            className="grid gap-3 rounded-2xl border border-[#dcded6] bg-[#f9faf7] p-4 dark:border-[#252d36] dark:bg-[#0f141b] md:grid-cols-[148px_1fr] md:p-5"
          >
            <div className="flex flex-wrap items-center gap-2 md:block">
              <p className="font-mono text-[13px] font-semibold text-[#8b5a1f] dark:text-[#989e72]">
                {entry.version}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#858876] dark:text-[#8e9ab0] md:mt-1">
                {entry.week}
              </p>
              <p className="text-[12px] text-[#6d6f65] dark:text-[#8e98a8] md:mt-3">{entry.range}</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#a2a498] dark:text-[#647083] md:mt-1">
                {entry.commits} commits
              </p>
            </div>
            <article>
              <h2 className="font-serif text-[18px] font-semibold text-[#15140f] dark:text-gray-100">
                {entry.title}
              </h2>
              <p className="mt-1 text-[13.5px] leading-6 text-[#53554d] dark:text-gray-300">{entry.summary}</p>
              <ChangelogSections entry={entry} />
            </article>
          </li>
        ))}
      </ol>
    </main>
  )
}
