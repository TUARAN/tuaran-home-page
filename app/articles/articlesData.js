/**
 * Shared article metadata for homepage highlights and article routes.
 */
export const articles = [
  {
    slug: 'frontend-weekly-445',
    title: '⏰前端周刊第445期（2025年12月15日–12月21日）',
    date: '2025-12-22',
    href: 'https://fwdc.pages.dev/',
    summary:
      '精选前端性能、框架演进与工程化经验，梳理一周值得关注的技术讨论与工具更新。',
    cover:
      'https://images.unsplash.com/photo-1527694224012-be005121c774?auto=format&fit=crop&w=800&q=60',
    content: [
      '本期周刊聚焦于快速演进的前端生态，从性能调优到工程化实践为你全面拆解。',
      '围绕 WebAssembly、React 生态和边缘部署，我们整理了多个值得试用的开源项目与案例。',
      '后台地址整理了 PDF 版本与在线阅读链接，方便收藏与分享。',
    ],
  },
  {
    slug: 'ocr-comparison-paddleocr-vl',
    title: 'OCR的新高度？PaddleOCR-VL 与 DeepSeek-OCR 的技术与应用横评',
    date: '2025-10-22',
    href: 'https://juejin.cn/post/7563860666349862962',
    summary:
      '全面对比两大 OCR 方案的识别精度、部署体验与场景适配性，帮助团队快速选型。',
    cover:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60',
    content: [
      '文章从数据集、模型结构和推理效率三个维度拆分评测流程。',
      '结合真实业务落地案例，展示了在票据识别和多语种文档处理中的效果差异。',
      '附录提供了 Benchmark 仓库与部署脚本，降低团队测试门槛。',
    ],
  },
  {
    slug: 'blogger-future-community',
    title: '技术社区已死？博主何去何从？',
    date: '2025-07-23',
    href: 'https://juejin.cn/post/7529964429057622067',
    summary:
      '复盘 2024-2025 年技术社区生态，拆解创作者多平台运营的现实挑战与破局策略。',
    cover:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=60',
    content: [
      '通过访谈 12 位长期创作者，总结流量结构变化下的内容定位策略。',
      '分享多平台协同运营工具链与增长实验数据，帮助创作者稳健迭代。',
      '提供“博主联盟”项目的内测申请与协作指南。',
    ],
  },
  {
    slug: 'agentic-workflows-2025',
    title: 'Agentic 前端工作流：2025 提效备忘录',
    date: '2025-04-18',
    href: 'https://fwdc.pages.dev/agents',
    summary:
      '围绕智能体辅助开发的最佳实践，盘点自动化评审、依赖治理与知识库搭建经验。',
    cover:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60',
    content: [
      '结合真实项目复盘 agent 加速前端交付的路径与坑点。',
      '整理工具选型清单与权限治理方案，保证团队落地安全可控。',
      '附赠脚手架模板与提示词合集，方便快速接入。',
    ],
  },
  {
    slug: 'edge-ai-observability',
    title: '边缘 AI 可观测性：从日志到高维向量指标',
    date: '2025-03-05',
    href: 'https://fwdc.pages.dev/edge-observability',
    summary:
      '介绍边缘推理场景下的可观测性体系搭建方法，覆盖日志、链路与向量指标。',
    cover:
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=60',
    content: [
      '拆分模型运行过程中的关键指标，配合可视化面板及时发现异常。',
      '分享向量数据库结合监控平台的落地方案，实现细粒度回溯。',
      '提供 Cloudflare Workers 与边缘节点的部署实践。',
    ],
  },
  {
    slug: 'codespaces-productivity-hacks',
    title: 'Codespaces 提效手记：三十个你应该知道的快捷技巧',
    date: '2025-01-26',
    href: 'https://fwdc.pages.dev/codespaces-tips',
    summary:
      '收集团队在 Codespaces 日常开发中的高频技巧，覆盖环境预热、调试与协作。',
    cover:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=60',
    content: [
      '总结约束条件下的资源配置策略，帮助控制成本。',
      '介绍 devcontainer.json 的实用配置片段与自动化脚本。',
      '附带协同开发的权限模型与最佳实践文档。',
    ],
  },
]
