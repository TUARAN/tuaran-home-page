/**
 * 工程作品：自研可视化、亲身实测、长期写作项目、富数据调研。
 *
 * 这些不是单纯 Markdown 调研，而是带交互、带可视化、带工程量的页面 ——
 * 是不可被 AI 替代的原创判断 + 工程实现。
 *
 * 既给 /works 路由展示用，也给 /articles?tab=works 复用。
 */

export const ENGINEERING_WORKS = [
  {
    id: 'cancers-overview',
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
    title: '日月运行交互可视化',
    summary:
      '用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化；把日出日落、昼夜分界和月相循环放在一个可交互模型里复盘。',
    date: '2026-05-31',
    href: '/sun-moon-motion',
    kind: '交互可视化',
  },
  {
    id: 'ai-token-usage-research',
    title: 'AI Token 用量与花费强度调研',
    summary:
      '日耗 1 亿 / 4.5 亿 tokens（账单口径，含缓存命中）对照：账单 vs 净处理双账户 + 对数刻度强度尺 + cache-aware 三段定价折算月费 + 订阅 vs 按量口径 + 效率信号 + 优化抓手 ROI 排序。',
    date: '2026-05-31',
    href: '/ai-token-usage-research',
    kind: '实测数据',
  },
  {
    id: 'zhang-juzheng-book',
    title: '《张居正：一个改革者的成事与代价》· 写作出版工程',
    summary:
      '用输出倒逼输入：把"写一本张居正的书并发布出版"作为长期富页面项目运营。主线、目录、人物关系、关键事件、12 个月节奏与进度看板。',
    date: '2026-05-30',
    href: '/zhang-juzheng-book',
    kind: '长期项目',
  },
]
