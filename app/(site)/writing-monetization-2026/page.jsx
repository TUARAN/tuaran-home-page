import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '中国写作变现 · 数据看板 2025-2026',
  description:
    '5 种写作变现机制、8 个内容平台、6 大小说平台、掘金小册销量样本、微信读书与传统出版生态对比。',
  keywords: ['涂阿燃', 'tuaran', '写作变现', '知识付费', '内容平台', '出版', '数据看板'],
  alternates: {
    canonical: '/writing-monetization-2026',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const KPI_CARDS = [
  { label: '变现机制', value: '5', note: '流量 / 订阅 / 课程 / 商单 / 私域' },
  { label: '知识平台', value: '8', note: '覆盖图文、社群、课程、短视频生态' },
  { label: '小说平台', value: '6', note: '付费与免费双轨并存' },
  { label: '传统出版社', value: '583', note: '2024 年核验通过' },
  { label: '内容电商占比', value: '40.53%', note: '2025 年首次超过平台电商' },
  { label: '微信读书估算收入', value: '¥33.8 亿/年', note: '按 200 万+重度用户估算' },
]

const MECHANISMS = [
  {
    type: '流量分成',
    moneyFlow: '广告主 -> 平台 -> 作者',
    platforms: '公众号流量主 / 头条 / 视频号 / 百家号',
    barrier: '低',
    ceiling: '中',
    barrierScore: 2,
    ceilingScore: 3,
  },
  {
    type: '付费订阅 / 社群',
    moneyFlow: '读者 -> 作者（平台抽 1%-5%）',
    platforms: '小报童 / 知识星球',
    barrier: '中',
    ceiling: '高',
    barrierScore: 3,
    ceilingScore: 4,
  },
  {
    type: '付费课程 / 专栏',
    moneyFlow: '读者 -> 平台分账（作者 40%-55%）',
    platforms: '得到 / 极客时间 / 知乎盐选 / 掘金小册',
    barrier: '高',
    ceiling: '高',
    barrierScore: 4,
    ceilingScore: 4,
  },
  {
    type: '软广 / 品牌合作',
    moneyFlow: '品牌方 -> 作者',
    platforms: '公众号软文 / 小红书蒲公英',
    barrier: '中',
    ceiling: '中高',
    barrierScore: 3,
    ceilingScore: 3.5,
  },
  {
    type: '私域转化',
    moneyFlow: '读者 -> 作者（无平台抽成）',
    platforms: '个人号 / 企微 + 内容导流',
    barrier: '高',
    ceiling: '极高',
    barrierScore: 4,
    ceilingScore: 5,
  },
]

const PLATFORMS = [
  { name: '小报童', barrier: '无门槛', payout: '84% 到手', sample: '私域创作者年入 7 位数', fit: '微信生态内，抽成低' },
  { name: '知识星球', barrier: '需自带信任', payout: '约 95% 到手', sample: '头部案例 10 天级千万流水', fit: '财经 / 投资赛道最强' },
  { name: '公众号流量主', barrier: '>=100 粉丝', payout: 'eCPM 0.5-2 元/千', sample: '金融类点击 5-8 元', fit: '纯流量难，需软广导流' },
  { name: '今日头条', barrier: '新人易过审', payout: '互动系数最高 3x', sample: '1 万粉阅读约 100 元', fit: '适合拿增量流量' },
  { name: '知乎盐选', barrier: '盐选投稿审核', payout: '实际到手约 45%', sample: '头部故事单篇过万', fit: '适合故事 / 虚构' },
  { name: '得到 / 极客时间', barrier: '需领域信誉', payout: '作者 40%-50%', sample: '头部课程数百万', fit: '更偏品牌背书' },
  { name: '小红书蒲公英', barrier: '>=1000 粉丝', payout: '品牌方付 10% 服务费', sample: '单条 200-2000', fit: '纯文字写手不友好' },
  { name: '视频号', barrier: '认证即可', payout: '视频系数 1.2x', sample: '仍在增长窗口', fit: '图文系数 1.0x' },
]

const JUEJIN_TOP10 = [
  { title: 'Redis 深度历险', sales: 19351, price: 19.9, revenue: 385085 },
  { title: '前端面试之道', sales: 7479, price: 49.9, revenue: 373202 },
  { title: 'MySQL 是怎样运行的', sales: 7396, price: 29.9, revenue: 221140 },
  { title: '剖析 Vue.js 内部运行机制', sales: 7033, price: 19.9, revenue: 139957 },
  { title: 'Netty 入门与实战', sales: 5999, price: 29.9, revenue: 179370 },
  { title: '前端性能优化原理与实践', sales: 5772, price: 19.9, revenue: 114863 },
  { title: '如何写一本掘金小册', sales: 5551, price: 9.9, revenue: 54955 },
  { title: '你不知道的 Chrome 调试技巧', sales: 5090, price: 19.9, revenue: 101291 },
  { title: 'Git 原理详解及实用指南', sales: 4968, price: 19.9, revenue: 98863 },
  { title: '使用 webpack 定制前端开发环境', sales: 4382, price: 9.9, revenue: 43382 },
]

const NOVEL_PLATFORMS = [
  { name: '起点中文网', mode: 'VIP 订阅（男频天花板）', note: '付费力最强，竞争也最激烈' },
  { name: '番茄小说', mode: '免费阅读 + 广告分成', note: '门槛低、流量大，头部效应极端' },
  { name: '七猫小说', mode: '免费 + 保底', note: '对新人现金流更友好' },
  { name: '晋江文学城', mode: '女频付费订阅', note: '女频与版权改编优势明显' },
  { name: '纵横中文网', mode: '男频次级阵地', note: '签约门槛较起点低' },
  { name: '刺猬猫', mode: '二次元轻小说订阅', note: '垂类明确，适配 ACGN 写手' },
]

const TRACK_COMPARE = [
  { metric: '收入来源', paid: '订阅 + 打赏 + 版权', free: '广告分成 + 保底稿酬' },
  { metric: '读者画像', paid: '核心付费读者', free: '海量长尾用户' },
  { metric: '收入天花板', paid: '极高（IP 改编）', free: '中高（稿费规模）' },
  { metric: '新人友好度', paid: '低到中', free: '高' },
  { metric: '更新压力', paid: '中', free: '高（日更 4k+）' },
]

const ROUTES = [
  {
    stage: 'A. 零基础（0 粉 / 0 信誉）',
    goal: '6 个月月入 ¥3000-5000',
    steps: ['W1-4：头条垂直写作验证题材', 'M2-3：公众号承接并沉淀 1000 粉', 'M4-6：上线小报童 9.9 元体验专栏'],
  },
  {
    stage: 'B. 已有 1000+ 粉丝',
    goal: '1 年月入 ¥1-3 万',
    steps: ['立即开小报童 29-99 元入门产品', '公众号软广 + 蒲公英商单并行', '6 个月内升级知识星球 199-488 元'],
  },
  {
    stage: 'C. 已有领域信誉（KOL）',
    goal: '年入 ¥100 万+',
    steps: ['直接上线 488-1499 元高客单星球', '得到 / 极客时间课程做品牌背书', '扩展训练营与企业内训 2999-9999 元'],
  },
  {
    stage: 'D. 小说作者',
    goal: '千字稿费 -> 版权变现',
    steps: ['番茄 / 七猫验证题材与节奏', '稳定后转起点（男频）或晋江（女频）', '完本后推进有声 / 影视 / 出版改编'],
  },
]

const CORE_RULES = [
  '单价 x 信任 = 收入。高客单本质来自高信任。',
  '头部效应持续增强，Top 1% 吃走主要收益。',
  '单平台风险极高，必须公域 + 订阅 + 私域组合。',
  'AI 是效率杠杆，不是内容差异化本身。',
]

const RECOMMENDED_LINKS = [
  {
    label: 'PublishLab',
    cta: '立即体验 PublishLab',
    href: 'https://publishlab.cc/',
    desc: '面向中文创作者的写作变现工作台：把选题、分发、订阅与增长路径串成可执行闭环。',
    note: '适合想从「持续写作」走到「稳定收入」的创作者与小团队。',
  },
]

const SOURCES = [
  ['小报童帮助中心', 'https://help.xiaobot.net/'],
  ['小报童排行榜', 'https://xiaobot.osguider.com/sort/subscriber-count/'],
  ['掘金小册', 'https://juejin.cn/course'],
  ['掘金小册销量统计', 'https://github.com/axetroy/juejin.book'],
  ['微信读书会员服务', 'https://weread.qq.com/policy?type=membership'],
  ['国家新闻出版署：2024 核验 583 家', 'https://www.nppa.gov.cn/xxfb/tzgs/202409/t20240905_861636.html'],
  ['国家新闻出版署：出版业数据', 'https://www.nppa.gov.cn/xxfb/ywdt/202501/t20250110_881307.html'],
]

function fmtNumber(n) {
  return new Intl.NumberFormat('zh-CN').format(n)
}

function scoreWidth(score) {
  return `${Math.max(0, Math.min(100, (score / 5) * 100))}%`
}

function MoneyPathQuadrant() {
  return (
    <div className="rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#333] dark:text-gray-100">门槛 vs 天花板象限</h3>
        <span className="text-xs text-[#8a8270] dark:text-gray-400">X: 门槛 / Y: 收入天花板</span>
      </div>
      <div className="relative h-72 rounded-lg border border-dashed border-[#ddd8cb] bg-[#faf7f0] dark:border-gray-700 dark:bg-[#121821]">
        <div className="absolute inset-x-0 top-1/2 border-t border-[#e9e2d5] dark:border-gray-700" />
        <div className="absolute inset-y-0 left-1/2 border-l border-[#e9e2d5] dark:border-gray-700" />
        <span className="absolute left-2 top-2 text-[11px] text-[#8a8270] dark:text-gray-400">高天花板</span>
        <span className="absolute right-2 bottom-2 text-[11px] text-[#8a8270] dark:text-gray-400">高门槛</span>
        {MECHANISMS.map((item) => {
          const left = `${(item.barrierScore / 5) * 100}%`
          const top = `${100 - (item.ceilingScore / 5) * 100}%`
          return (
            <div
              key={item.type}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, top }}
            >
              <div className="rounded-full border border-[#cbd9ee] bg-[#eff4fc] px-2 py-1 text-[11px] font-medium text-[#3b5b8a] shadow-sm dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]">
                {item.type}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WritingMonetizationDashboardPage() {
  const maxSales = Math.max(...JUEJIN_TOP10.map((item) => item.sales))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 border-b border-[#eee] pb-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              中国写作变现 · 数据看板 2025-2026
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              按「机制-平台-赛道-路径」拆解写作收入模型，用一页看清进入门槛、分成结构和增长路线。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/articles" className="text-sm text-[#5a6b8a] underline underline-offset-4 hover:text-[#33405a] dark:text-gray-400">
              返回知识库
            </Link>
            <SharePageButton
              title="中国写作变现 · 数据看板 2025-2026"
              text="按机制-平台-赛道-路径拆解写作收入模型。"
              url="/writing-monetization-2026"
            />
          </div>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-[#d8c7a7] bg-[linear-gradient(135deg,#fff7ea,#f7eddc)] p-5 shadow-[0_10px_30px_rgba(138,90,20,0.10)] dark:border-[#3e3426] dark:bg-[linear-gradient(135deg,#2a2115,#1f180f)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#8a5a14] dark:text-[#e2bd75]">
              推荐工具
            </p>
            <p className="mb-0 text-sm text-[#5d503f] dark:text-gray-200">
              如果你希望把这页「机制-平台-赛道-路径」框架直接落地到日常创作流程，可以优先试试 PublishLab。
            </p>
            <p className="mb-0 mt-1 text-xs text-[#7a6a53] dark:text-[#c8b89d]">
              从内容策略到转化动作，减少试错周期，把写作增长变成可复用系统。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow inline-flex items-center rounded-xl border border-[#8a5a14]/45 bg-[#8a5a14] px-4 py-2.5 text-sm font-semibold text-[#fff8ec] no-underline shadow-[0_8px_20px_rgba(138,90,20,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#704710] hover:shadow-[0_12px_24px_rgba(138,90,20,0.30)] dark:border-[#e2bd75]/60 dark:bg-[#e2bd75] dark:text-[#2f210f] dark:hover:bg-[#f0cc87]"
                title={item.desc}
              >
                {item.cta} ↗
              </a>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-[#8a5a14]/20 bg-white/65 px-3 py-2 text-xs text-[#6a573d] dark:border-[#e2bd75]/25 dark:bg-[#15110c]/60 dark:text-[#d8c39b]">
          {RECOMMENDED_LINKS[0].note}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-xs tracking-wide text-[#8a8270] dark:text-gray-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f2937] dark:text-gray-100">{card.value}</p>
            <p className="mt-1 text-xs text-[#666] dark:text-gray-400">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">5 种变现机制对比</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">机制</th>
                  <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">资金路径</th>
                  <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">代表平台</th>
                  <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">门槛</th>
                  <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">天花板</th>
                </tr>
              </thead>
              <tbody>
                {MECHANISMS.map((item) => (
                  <tr key={item.type}>
                    <td className="border border-[#eee] px-3 py-2 font-medium text-[#444] dark:border-gray-800 dark:text-gray-200">{item.type}</td>
                    <td className="border border-[#eee] px-3 py-2 text-[#666] dark:border-gray-800 dark:text-gray-300">{item.moneyFlow}</td>
                    <td className="border border-[#eee] px-3 py-2 text-[#666] dark:border-gray-800 dark:text-gray-300">{item.platforms}</td>
                    <td className="border border-[#eee] px-3 py-2 dark:border-gray-800">
                      <div className="h-2 rounded bg-[#e9e2d5] dark:bg-gray-700">
                        <div className="h-2 rounded bg-[#a09176]" style={{ width: scoreWidth(item.barrierScore) }} />
                      </div>
                      <span className="mt-1 block text-xs text-[#8a8270] dark:text-gray-400">{item.barrier}</span>
                    </td>
                    <td className="border border-[#eee] px-3 py-2 dark:border-gray-800">
                      <div className="h-2 rounded bg-[#d9e8f9] dark:bg-gray-700">
                        <div className="h-2 rounded bg-[#3b5b8a]" style={{ width: scoreWidth(item.ceilingScore) }} />
                      </div>
                      <span className="mt-1 block text-xs text-[#8a8270] dark:text-gray-400">{item.ceiling}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2">
          <MoneyPathQuadrant />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">8 大平台得分卡</h2>
        <p className="mt-1 text-xs text-[#8a8270] dark:text-gray-400">偏数据侧的快速筛选：看门槛、分成和赛道匹配度。</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <article key={platform.name} className="rounded-lg border border-[#eee] p-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-[#333] dark:text-gray-100">{platform.name}</h3>
              <p className="mt-1 text-xs text-[#666] dark:text-gray-300">门槛：{platform.barrier}</p>
              <p className="mt-1 text-xs text-[#666] dark:text-gray-300">分成/单价：{platform.payout}</p>
              <p className="mt-1 text-xs text-[#666] dark:text-gray-300">样本：{platform.sample}</p>
              <p className="mt-1 text-xs text-[#8a8270] dark:text-gray-400">{platform.fit}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">掘金小册 Top10 销量样本</h2>
        <p className="mt-1 text-xs text-[#8a8270] dark:text-gray-400">客单价 9.9-49.9 元，头部技术选题存在明确长尾收益。</p>
        <div className="mt-4 space-y-3">
          {JUEJIN_TOP10.map((book, idx) => (
            <div key={book.title} className="rounded-lg border border-[#eee] p-3 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#333] dark:text-gray-100">
                  #{idx + 1} {book.title}
                </p>
                <p className="text-xs text-[#666] dark:text-gray-300">
                  销量 {fmtNumber(book.sales)} · 单价 ¥{book.price} · 累计 ¥{fmtNumber(book.revenue)}
                </p>
              </div>
              <div className="mt-2 h-2 rounded bg-[#e9e2d5] dark:bg-gray-700">
                <div className="h-2 rounded bg-[#8a5a14]" style={{ width: `${(book.sales / maxSales) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">小说平台矩阵（6 站）</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {NOVEL_PLATFORMS.map((item) => (
                <li key={item.name} className="rounded-lg border border-[#eee] p-3 text-sm dark:border-gray-800">
                  <p className="font-medium text-[#333] dark:text-gray-100">{item.name}</p>
                  <p className="mt-1 text-[#666] dark:text-gray-300">{item.mode}</p>
                  <p className="mt-1 text-xs text-[#8a8270] dark:text-gray-400">{item.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="xl:col-span-2">
            <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">付费 vs 免费阅读</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">维度</th>
                    <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">付费平台</th>
                    <th className="border border-[#eee] bg-[#faf7f0] px-3 py-2 text-left dark:border-gray-800 dark:bg-gray-800/60">免费平台</th>
                  </tr>
                </thead>
                <tbody>
                  {TRACK_COMPARE.map((row) => (
                    <tr key={row.metric}>
                      <td className="border border-[#eee] px-3 py-2 font-medium text-[#444] dark:border-gray-800 dark:text-gray-200">{row.metric}</td>
                      <td className="border border-[#eee] px-3 py-2 text-[#666] dark:border-gray-800 dark:text-gray-300">{row.paid}</td>
                      <td className="border border-[#eee] px-3 py-2 text-[#666] dark:border-gray-800 dark:text-gray-300">{row.free}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100">按起点选路径</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ROUTES.map((route) => (
            <article key={route.stage} className="rounded-lg border border-[#eee] p-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-[#333] dark:text-gray-100">{route.stage}</h3>
              <p className="mt-1 text-xs text-[#8a8270] dark:text-gray-400">目标：{route.goal}</p>
              <ol className="mt-2 space-y-1 text-sm text-[#666] dark:text-gray-300">
                {route.steps.map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#e9d5b8] bg-[#fbf3e3] p-4 dark:border-[#3a2f1c] dark:bg-[#2a2115]">
        <h2 className="text-lg font-semibold text-[#8a5a14] dark:text-[#e2bd75]">4 条核心规律</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#5d503f] dark:text-gray-200">
          {CORE_RULES.map((rule) => (
            <li key={rule}>- {rule}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-[#eee] pt-6 dark:border-gray-800">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-[#5a6b8a] underline underline-offset-4 dark:text-gray-300">
            展开数据来源
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {SOURCES.map(([label, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noreferrer" className="text-[#5a6b8a] underline underline-offset-4 hover:text-[#33405a] dark:text-gray-400">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  )
}
