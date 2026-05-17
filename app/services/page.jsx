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

// ⚠️ 价格 placeholder：由站长拍板后填实数
const services = [
  {
    icon: '🤝',
    title: 'AI 落地咨询（1v1）',
    summary: '帮企业 / 团队厘清"AI 该不该用、用在哪、怎么落地"。',
    bullets: [
      '面向角色：CTO / CIO / 产品负责人 / 技术经理',
      '产出：可执行的 AI 切入点清单 + 工程化路径图',
      '形式：1-2 小时 视频会议（可加书面方案）',
    ],
    price: '¥X,XXX / 小时',
  },
  {
    icon: '🏛',
    title: '央国企数字员工方案',
    summary: '基于矩联科技实战经验，为政企客户定制 AI 数字员工。',
    bullets: [
      '覆盖：流程梳理 / 模型选型 / 信创适配 / 落地培训',
      '客户：央国企 / 事业单位 / 大型集团',
      '形式：定制项目，按需排期',
    ],
    price: '¥XX,XXX 起 / 项目',
  },
  {
    icon: '📊',
    title: '深度调研定制',
    summary: '按企业 / 投资机构需求出 9 章节调研报告，含不常见洞见。',
    bullets: [
      '示例：参考站内 公司调研 / 事项调研 系列',
      '交付：Markdown + PDF + 信息来源附录',
      '周期：5-10 个工作日 / 篇',
    ],
    price: '¥X,XXX 起 / 篇',
  },
  {
    icon: '✍️',
    title: '内容合作 · KOL 推广',
    summary: '通过博主联盟（blogger-alliance.cn）触达 50+ 技术博主矩阵。',
    bullets: [
      '面向：AI 产品方 / 云厂商 / 开发者工具',
      '形式：单博主软文 / 多博主矩阵 / 主题 campaign',
      '量级：根据预算分级',
    ],
    price: '面议',
  },
  {
    icon: '📚',
    title: '出版与课程合作',
    summary: '出版社约稿、技术课程录制、企业内训。',
    bullets: [
      '方向：AI Agent / 前端工程化 / 大模型应用',
      '形式：约稿 / 共著 / 课程录制 / 内训',
    ],
    price: '面议',
  },
  {
    icon: '💼',
    title: '矩联科技产品合作',
    summary: '矩联科技（matrixlink.tech）已有产品的代理 / 集成。',
    bullets: [
      '可对接：自有产品矩阵 + 合作方资源',
      '形式：渠道分销 / 项目集成 / OEM',
    ],
    price: '面议',
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
