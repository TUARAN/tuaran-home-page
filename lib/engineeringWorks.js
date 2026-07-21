/**
 * 多维页面：自研可视化、亲身实测、长期写作项目、富数据调研。
 *
 * 这些不是单纯 Markdown 调研，而是带交互、带可视化、带工程量的页面 ——
 * 是不可被 AI 替代的原创判断 + 工程实现。
 *
 * 若先在 Cursor Canvas 里做交互原型，登记 canvasId（见 lib/canvasProvenance.js）。
 *
 * 既给 /works 路由展示用，也给 /articles?tab=works 复用。
 */

export const ENGINEERING_WORK_CATEGORIES = [
  {
    id: 'ai-engineering',
    title: 'AI 工程',
    description: '端侧推理、智能体能力、AI 工具链实验。',
  },
  {
    id: 'data-visualization',
    title: '数据可视化',
    description: '把复杂数据做成交互视图和可复盘判断。',
  },
  {
    id: 'engineering-research',
    title: '工程调研',
    description: '围绕技术路线、平台格局和真实成本的结构化研判。',
  },
  {
    id: 'long-term-project',
    title: '长期项目',
    description: '用页面承载持续写作、长期输入和阶段性产出。',
  },
  {
    id: 'life-system',
    title: '生活系统',
    description: '把家庭节奏与日常决策做成可持续使用的交互页面。',
  },
]

// 多维页面只允许两种展示模式，避免每个专题继续发明自己的页面壳、宽度和导航规则。
// site：跟随主站（站点导航 + 页脚 + 1120px 内容宽度 + 站点主题）。
// feature：沉浸式专题（隐藏主站 chrome + 全宽画布 + 深色专题基底）。
export const RICH_PAGE_PRESENTATIONS = Object.freeze({
  site: Object.freeze({
    id: 'site',
    label: '站点型',
    description: '与主站保持一致',
  }),
  feature: Object.freeze({
    id: 'feature',
    label: '沉浸型',
    description: '统一的独立专题样式',
  }),
})

export const ENGINEERING_WORKS = [
  {
    id: 'margin-account-313m-loss-investigation',
    category: 'engineering-research',
    title: '月亏3.13亿：一张两融截图背后的十亿级资金谜局',
    summary:
      '从午盘指数、9.23亿元隐含期初净资产和两套杠杆情景出发，把行情真实、账户数据真实与账户身份真实分成三层核验；追查“神秘游资”传闻的证据缺口，并评估截图修改、借图传播与多账户拼接等可能性。',
    date: '2026-07-21',
    href: '/margin-account-313m-loss-investigation',
    kind: '财经截图调查',
    badge: 'New',
  },
  {
    id: 'ai-agent-communications-industry-report',
    category: 'engineering-research',
    title: 'AI 智能体通信能力行业报告',
    summary:
      '从 OpenClaw Channel 与通信 Skill、WorkBuddy、豆包、微信“小微”到 Token 经济，区分官方数据、第三方监测和本站测算，解释消息、短信与电话如何被封装为 Agent 可执行能力。',
    date: '2026-07-21',
    href: '/ai-agent-communications-industry-report',
    kind: '前沿行业研究',
    badge: 'New',
  },
  {
    id: 'x-platform-intelligence',
    category: 'data-visualization',
    title: 'X 值不值得做？创作者经营情报',
    summary: '为中文科技创作者回答 X 是否值得投入、应该负责什么、怎样形成经营闭环；把行动建议与用户规模、市场信号、平台风险和完整证据放在同一条决策路径里。',
    date: '2026-07-20',
    href: '/x-platform-intelligence',
    kind: '创作者经营指南',
    badge: 'New',
  },
  {
    id: 'wisdom-frontier',
    category: 'data-visualization',
    title: '智慧边界：全球顶级奖项与人类成就图谱',
    summary:
      '覆盖自然科学、数学、计算机、工程、医学、设计、人文与艺术等 15 个领域，以 33 项全球顶级奖项、代表人物和关键成就建立可筛选、可持续扩充的智慧地图。',
    date: '2026-07-18',
    href: '/wisdom-frontier',
    kind: '人类成就图谱',
    badge: 'New',
  },
  {
    id: 'guoqi-guodan',
    presentation: 'feature',
    category: 'engineering-research',
    title: '国企“过单”：走单、空转贸易与融资性贸易全流程',
    summary:
      '从交易实质出发，拆解融资垫资、冲量空转与真实供应链三类场景；把双方动机、货权控制、资金路径、发票边界、四层风险和七项红旗做成可切换、可自查的合规专题页。',
    date: '2026-07-18',
    href: '/guoqi-guodan',
    kind: '贸易合规专题',
    badge: 'New',
  },
  {
    id: 'global-ai-governance',
    category: 'engineering-research',
    title: '全球 AI 治理平台与机制全景图',
    summary:
      '把 GPAI、OECD.AI、联合国体系、WAICO、上合、非盟、金砖、东盟等 14 个国际 AI 组织、政治进程、战略与研究网络放进同一张制度地图；可按阵营、权威和执行力筛选，展开档案并做最多四项横向对比。',
    date: '2026-07-17',
    href: '/global-ai-governance',
    kind: '全球治理图谱',
    badge: 'New',
  },
  {
    id: 'workbuddy-harness',
    category: 'ai-engineering',
    title: 'WorkBuddy Harness：给 AI Agent 补上一套“运行制度”',
    summary:
      '从技术博主视角拆解九维 Agent 基础设施：Engine 如何驱动 Hooks，身份、记忆、调度、安全、评测与多 Agent 协作如何进入同一套运行闭环，以及项目真正的价值和当前边界。',
    date: '2026-07-16',
    href: '/workbuddy-harness',
    kind: '开源项目拆解',
    badge: 'New',
  },
  {
    id: 'network-access-guide',
    category: 'engineering-research',
    title: '5 个网络加速服务公开信息核验',
    summary:
      '对红海 Pro、平行网、脉动云、火烧云、鱼云的当前状态、套餐、协议、节点与来源做横向核验；把官网事实、第三方口径和待验证项拆开，给出月付实测与购买前检查框架。',
    date: '2026-07-15',
    href: '/network-access-guide',
    kind: '公开信息核验',
    badge: 'New',
  },
  {
    id: 'xiaomoli-dad-todo',
    category: 'life-system',
    audience: 'owner',
    title: '小茉莉的爸爸带娃清单',
    summary:
      '围绕日常、习惯与家庭节奏的私域打卡页面：按日完成清单、回看月历与 30 天统计，把零散的带娃事项沉淀为可持续复盘的家庭系统。',
    date: '2026-07-12',
    href: '/xiaomoli-dad-todo',
    kind: '家庭生活系统',
    badge: 'New',
  },
  {
    id: 'eatwhat',
    category: 'life-system',
    title: '吃什么',
    summary:
      '把一日三餐的选择做成家庭决策页：根据时段随机推荐爸爸妈妈的菜单，并单独维护适合小茉莉的宝宝餐清单。',
    date: '2026-07-12',
    href: '/eatwhat',
    kind: '家庭决策页面',
    badge: 'New',
  },
  {
    id: 'web-llm',
    presentation: 'feature',
    category: 'ai-engineering',
    title: '端侧大模型实验台',
    summary:
      '浏览器端运行大模型的工程实验：围绕 WebGPU、Transformers.js、ONNX Runtime、Ollama 与边缘设备，把端侧推理从概念验证落到可访问、可体验的站内页面。',
    date: '2026-06-03',
    href: '/web-llm',
    kind: '端侧 AI 工程',
    badge: 'New',
  },
  {
    id: 'skill-market-research',
    category: 'engineering-research',
    title: 'Skill 上架、宣发与回流工程调研',
    summary:
      '从 Codex / GitHub / ClawHub / X / 第三方 marketplace 观察主流 Skill 的制作、包装、上架、宣发与回流方式，整理成「可执行能力 → 可信开源项目 → 可安装市场 → 社交传播 → 用户回流」的工程打法。',
    date: '2026-06-05',
    href: '/skill-market-research',
    kind: '多维页面调研',
    badge: 'New',
  },
  {
    id: 'platform-framework-pairs',
    category: 'engineering-research',
    title: '《Anthropic × Bun + Cloudflare × VoidZero + Vercel × Next：三极割据，AI 公司直接下场抢 Web Runtime》',
    summary:
      '2025-12 Anthropic 收购 Bun（公司首次收购）+ 2026-06 Cloudflare 收购 VoidZero + 2016 起 Vercel × Next：三极格局成形。Anthropic 是新形态 —— AI 模型公司直接拥有 runtime，绕过 deployment 平台层。10 节研报框架 + 11 组「平台 × 框架」配对可视化（散点 / 排行 / 焦点 / 对比 / 全部可分享）。',
    date: '2026-06-05',
    href: '/platform-framework-pairs',
    kind: '富数据研判',
    badge: 'Featured',
  },
  {
    id: 'cancers-overview',
    category: 'data-visualization',
    title: '癌症全景',
    summary:
      '10 种主要癌症的发病、死亡、5 年生存、性别 / 年龄分布与风险因子可视化：四象限散点 + 横向排行 + 焦点 / 对比模式 + 全球 / 中国双口径切换；数据来自 GLOBOCAN 2022 与 NCC 2024。',
    date: '2026-06-04',
    href: '/cancers-overview',
    kind: '富数据可视化',
    badge: 'New',
  },
  {
    id: 'tang-ping-map',
    category: 'data-visualization',
    title: '躺平地图：低总价房源多维观察',
    summary:
      '基于 Tang Ping Map 公开点位做站内多维页面：121 个低总价房源样本，按省份、关键词、总价、面积、租金、租金回报和回本周期筛选观察，并用经纬度近似投影呈现地理分布。',
    date: '2026-07-04',
    href: '/tang-ping-map',
    kind: '地图数据可视化',
    badge: 'New',
  },
  {
    id: 'x-mutual-aid-circle',
    presentation: 'feature',
    category: 'data-visualization',
    title: 'X 互帮互助圈子：真实互动，一起把 X 流量玩明白',
    summary:
      'X 早期互动、互关清理、发帖时段热力图、Tweepcred 评分与可见性检测合在一起的社群增长多维页面：把圈子规则、工具链和时间策略放到同一个可操作入口。',
    date: '2026-07-03',
    href: '/x-mutual-aid-circle',
    kind: '社群增长工具页',
    badge: 'Hot',
  },
  {
    id: 'sun-moon-motion',
    category: 'data-visualization',
    title: '日月运行交互可视化',
    summary:
      '用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化；把日出日落、昼夜分界和月相循环放在一个可交互模型里复盘。',
    date: '2026-05-31',
    href: '/sun-moon-motion',
    kind: '交互可视化',
  },
  {
    id: 'ai-token-usage-research',
    category: 'engineering-research',
    title: 'AI Token 用量与花费强度调研',
    summary:
      '日耗 1 亿 / 4.5 亿 tokens（账单口径，含缓存命中）对照：账单 vs 净处理双账户 + 对数刻度强度尺 + cache-aware 三段定价折算月费 + 订阅 vs 按量口径 + 效率信号 + 优化抓手 ROI 排序。',
    date: '2026-05-31',
    href: '/ai-token-usage-research',
    kind: '实测数据',
    canvasId: 'ai-token-usage-analysis',
  },
  {
    id: 'zhang-juzheng-book',
    category: 'long-term-project',
    title: '《张居正：一个改革者的成事与代价》· 写作出版工程',
    summary:
      '用输出倒逼输入：把"写一本张居正的书并发布出版"作为长期富页面项目运营。主线、目录、人物关系、关键事件、12 个月节奏与进度看板。',
    date: '2026-05-30',
    href: '/zhang-juzheng-book',
    kind: '长期项目',
  },
]

export function getRichPagePresentation(work) {
  const presentation = work?.presentation || 'site'
  return RICH_PAGE_PRESENTATIONS[presentation] || RICH_PAGE_PRESENTATIONS.site
}

export function getRichPageByPath(pathname) {
  return ENGINEERING_WORKS.find((work) => work.href === pathname) || null
}
