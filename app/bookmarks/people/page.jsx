import BookmarksTocLayout from '../../components/BookmarksTocLayout'

export const dynamic = 'force-static'

export const metadata = {
  title: '人物志',
  description: '值得长期跟踪的人物、访谈与一手资料入口（持续补充）。',
}

const people = [
  {
    name: '赵长鹏（CZ）',
    description:
      '加密行业最具代表性的“工程师型创始人”。从交易系统与撮合引擎出身，切入加密基础设施并把交易所做成全球级产品。',
    url: 'https://x.com/cz_binance',
    tags: ['Crypto', 'Exchange', 'Founder'],
    summary:
      '关键词：技术底色、极致执行、平台型生意、强监管环境下的合规博弈。适合当作“高频系统 + 产品增长 + 风险管理”三条线交汇的商业样本来读。',
    facts: [
      { label: '别名', value: 'CZ' },
      { label: '身份', value: 'Binance 创始人（长期对外代表人物）' },
      { label: '背景', value: '计算机与交易系统相关经历；偏工程与系统构建' },
      { label: '领域', value: '加密交易基础设施 / 平台产品' },
    ],
    timeline: [
      { year: '早期', text: '从工程与交易系统相关岗位起步，做过撮合/交易软件。' },
      { year: '2013', text: '开始把主要精力转向加密行业，并持续加深参与。' },
      { year: '2017', text: '创立 Binance；在极短时间完成产品、流动性与全球化扩张。' },
      { year: '2018-2022', text: '平台规模化后，进入“增长 vs 风险/合规”拉扯的长期阶段。' },
      { year: '2023', text: '在美国监管/合规相关事件后卸任 CEO，平台进入更强合规取向的治理周期。' },
      { year: '2024', text: '个人层面经历司法处置与短期服刑（公开报道），随后回归公众视野。' },
    ],
    angles: [
      {
        title: '可以从他身上学什么？',
        bullets: [
          '撮合与交易系统：性能、稳定性、风控、峰值容量这些“硬指标”如何变成产品护城河。',
          '平台战略：先做流动性与核心体验，再做生态与基础设施外延。',
          '增长节奏：在窗口期快速扩张的打法，以及随之而来的治理成本。',
        ],
      },
      {
        title: '需要保持警惕的风险点',
        bullets: ['强监管行业的合规成本与不确定性', '平台型业务的声誉风险与系统性风险'],
      },
    ],
  },
]

const tocItems = people.map((item, idx) => ({
  id: `person-${idx}`,
  title: item.name,
  subItems: [{ id: `person-${idx}-link`, label: '链接' }],
}))

export default function PeopleBookmarksPage() {
  return (
    <BookmarksTocLayout
      title="人物志"
      description="值得长期跟踪的人物、访谈与一手资料入口（持续补充）。"
      tocItems={tocItems}
      footer={<p>如果你希望加入某位人物/栏目，我也可以帮你整理成条目。</p>}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {people.map((item, idx) => (
          <section
            key={item.url}
            className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4"
          >
            <h2 id={`person-${idx}`} className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24">
              {item.name}
            </h2>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>

            {item.summary ? (
              <div className="mt-3 text-sm text-[#666] dark:text-gray-300 leading-relaxed">{item.summary}</div>
            ) : null}

            {item.facts && item.facts.length > 0 ? (
              <div className="mt-4 overflow-x-auto border border-gray-200/70 dark:border-gray-800">
                <table className="min-w-full text-left text-xs sm:text-sm text-[#444] dark:text-gray-200">
                  <tbody>
                    {item.facts.map((row) => (
                      <tr key={row.label} className="border-t border-gray-200/60 dark:border-gray-800 first:border-t-0">
                        <td className="px-3 py-2 whitespace-nowrap text-[#555] dark:text-gray-300 font-semibold">
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-[#666] dark:text-gray-300">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {item.timeline && item.timeline.length > 0 ? (
              <div className="mt-4">
                <div className="text-xs font-bold text-[#444] dark:text-gray-200">时间线</div>
                <ol className="mt-2 space-y-2 text-sm text-[#666] dark:text-gray-300">
                  {item.timeline.map((t) => (
                    <li key={`${item.name}-${t.year}-${t.text}`} className="flex gap-3">
                      <span className="w-16 shrink-0 text-[#999] dark:text-gray-400">{t.year}</span>
                      <span className="min-w-0">{t.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {item.angles && item.angles.length > 0 ? (
              <div className="mt-5 space-y-4">
                {item.angles.map((block) => (
                  <div key={block.title}>
                    <div className="text-xs font-bold text-[#444] dark:text-gray-200">{block.title}</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-[#666] dark:text-gray-300">
                      {block.bullets.map((b) => (
                        <li key={`${block.title}-${b}`}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            <div id={`person-${idx}-link`} className="mt-4 text-sm text-[#666] dark:text-gray-300 scroll-mt-24">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
              >
                打开链接
              </a>
              <div className="mt-1 text-xs text-[#999] dark:text-gray-400 break-all">{item.url}</div>
            </div>

            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </BookmarksTocLayout>
  )
}
