/**
 * 工程作品：自研可视化、亲身实测、长期写作项目、富数据调研。
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
]

export const ENGINEERING_WORKS = [
  {
    id: 'cloudflare-personal-site-map',
    category: 'engineering-research',
    title: 'Cloudflare 开发者平台选型地图 · 2aran.com 个人站该用哪个',
    summary:
      '对照 tuaran-home-page 的真实代码与 wrangler 配置：交互式产品判定表 + 数据流图 + D1/R2/KV 分工 + R2 触发规则。已用 Pages + D1；R2 暂不需要；KV / DO / Workers AI 大多可跳过。',
    date: '2026-06-09',
    href: '/cloudflare-personal-site-map',
    kind: '交互工程研判',
    badge: 'New',
    canvasId: 'cloudflare-personal-site-map',
  },
  {
    id: 'web-llm',
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
    kind: '工程作品调研',
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
