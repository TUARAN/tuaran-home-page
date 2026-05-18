import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '商务合作 · 服务列表',
  description:
    '涂阿燃（tuaran）提供的合作方向：AI 咨询、数字员工方案、调研定制、内容合作、出版与课程。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '商务合作',
    'AI 咨询',
    '数字员工',
    '调研定制',
    '内容合作',
    '矩联科技',
    '博主联盟',
  ],
  alternates: { canonical: '/services' },
}

// 定价基于 2026-05 市场调研：独立 AI 顾问 ¥1k-3k/h、央国企 RPA 单流程 ¥10-30 万、独立调研 ¥3-15k/篇
// 价格仅为"参考门槛"，复杂项目按工作量重新报价
const services = [
  {
    icon: '🤝',
    title: 'AI 落地咨询（1v1）',
    summary: '帮企业 / 团队厘清"AI 该不该用、用在哪、怎么落地"，避免无效投入。',
    bullets: [
      '面向角色：CTO / CIO / 产品负责人 / 技术经理',
      '产出：可执行的 AI 切入点清单 + 工程化路径图',
      '形式：1-2 小时 视频会议（可加书面方案）',
      '首次咨询特价 ¥1,000 / 小时（限 1 次）',
    ],
    price: '¥1,500 / 小时',
  },
  {
    icon: '🏛',
    title: '央国企数字员工方案',
    summary: '基于矩联科技实战经验，为政企客户定制 AI 数字员工 + 信创适配。',
    bullets: [
      '覆盖：流程梳理 / 模型选型 / 信创适配 / 落地培训',
      '客户：央国企 / 事业单位 / 大型集团',
      '形式：单流程 PoC ¥80,000 起，多流程 ¥200,000-500,000',
      '排期：通常 2-3 个月起，复杂方案 6 个月+',
    ],
    price: '¥80,000 起 / 项目',
  },
  {
    icon: '📊',
    title: '深度调研定制',
    summary: '按企业 / 投资机构需求出 9 章节调研报告，含独家"不常见洞见"。',
    bullets: [
      '示例：参考站内 公司调研 / 事项调研 系列',
      '交付：Markdown + PDF + 信息来源附录 + 推断置信度标注',
      '周期：5-10 个工作日 / 篇',
      '系列包：3-5 篇主题包 ¥20,000-80,000',
    ],
    price: '¥5,000 起 / 篇',
  },
  {
    icon: '✍️',
    title: '内容合作 · KOL 推广',
    summary: '通过博主联盟（blogger-alliance.cn）触达 50+ 技术博主矩阵。',
    bullets: [
      '面向：AI 产品方 / 云厂商 / 开发者工具',
      '单平台软文：¥3,000 起 / 条（掘金 / 小红书 / CSDN / 51CTO 等）',
      '矩阵打包：¥15,000 起（5-8 个博主同步发布）',
      '年框合作：¥50,000+ （季度复盘 + 内容共创）',
    ],
    price: '¥3,000 起',
  },
  {
    icon: '📚',
    title: '出版与课程合作',
    summary: '出版社约稿、技术课程录制、企业内训。',
    bullets: [
      '方向：AI Agent / 前端工程化 / 大模型应用',
      '形式：约稿 / 共著 / 课程录制 / 企业内训',
      '已合作：人民邮电出版社、机械工业出版社等',
    ],
    price: '面议',
  },
  {
    icon: '💼',
    title: '矩联科技产品合作',
    summary: '矩联科技（matrixlink.tech）已有产品的代理 / 集成 / OEM。',
    bullets: [
      '可对接：自有产品矩阵 + 合作方资源',
      '形式：渠道分销 / 项目集成 / OEM',
      '建议直接联系 matrixlink.tech',
    ],
    price: '面议',
  },
]

const pricingPrinciples = [
  {
    icon: '🎯',
    title: '不卖时间，卖确定性',
    desc: '价格反映的是"少踩坑"——你买的是别人踩过的路。',
  },
  {
    icon: '📐',
    title: '不卖名头，卖结果',
    desc: '每个方向都附可参考案例 / 站内调研 / 已合作客户。',
  },
  {
    icon: '⚖️',
    title: '不接低于门槛的项目',
    desc: '不是傲气，是机会成本。门槛价帮你判断是否值得对话。',
  },
]

export default function ServicesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <header className="mb-10 border-b border-[#e8dfd0] pb-8 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          Services · 合作方向
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100 md:text-3xl">
          想和我合作？
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#5d554a] dark:text-gray-300">
          下面是我目前对外提供的合作方向。所有具体合作都以邮件 / 微信进一步确认为准。
          <br />
          价格仅作为参考区间，复杂项目按工作量重新报价。
        </p>
      </header>

      <section className="mb-10">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
          Pricing Philosophy · 定价三条
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {pricingPrinciples.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-[#e8dfd0] bg-[#fcfbf7] p-4 dark:border-gray-800 dark:bg-gray-900/60"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[18px]" aria-hidden="true">
                  {p.icon}
                </span>
                <span className="text-[14px] font-semibold text-[#221f19] dark:text-gray-100">{p.title}</span>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#666] dark:text-gray-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <article
            key={s.title}
            className="rounded-2xl border border-[#e8dfd0] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[22px]" aria-hidden="true">
                {s.icon}
              </span>
              <h2 className="text-[17px] font-semibold text-[#221f19] dark:text-gray-100">{s.title}</h2>
            </div>
            <p className="mt-3 text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">{s.summary}</p>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-6 text-[#666] dark:text-gray-400">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#b7791f] dark:bg-[#e2bd75]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 inline-flex items-center rounded-full border border-[#e8dfd0] bg-[#fbf3e3] px-3 py-1 font-mono text-[12px] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]">
              {s.price}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#e8dfd0] bg-[#fcfbf7] p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-serif text-xl font-semibold text-[#221f19] dark:text-gray-100">如何联系</h2>
        <p className="mt-3 text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">
          加微信 <span className="font-mono font-semibold">atar24</span>，注明：<br />
          <span className="font-mono text-[13px]">「来自 tuaran.me / 合作类型 / 公司或项目」</span>
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/about"
            className="inline-flex items-center rounded-full border border-[#ded6c8] bg-white px-4 py-1.5 text-[13px] text-[#5f5a4d] no-underline transition hover:border-[#9c8e72] hover:text-[#221f19] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
          >
            先看看我是谁 →
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center rounded-full border border-[#ded6c8] bg-white px-4 py-1.5 text-[13px] text-[#5f5a4d] no-underline transition hover:border-[#9c8e72] hover:text-[#221f19] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
          >
            参考调研样本 →
          </Link>
        </div>
      </section>
    </main>
  )
}
