import PageContainer from '../components/PageContainer'
import { CHANGELOG as changelog } from '../../../lib/changelogData'

export const dynamic = 'force-static'

export const metadata = {
  title: '站点更新记录',
  description: '从 git 提交历史归纳而来的 2aran.com 站点周更记录，按自然周整理版本、功能演进与内容建设。',
  alternates: { canonical: '/changelog' },
}


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

// 站点设计原则：一直隐含在代码里的规矩，这里写明，作为后续每次改样式的对照基准。
const DESIGN_PRINCIPLES = [
  {
    title: 'Token 优先，组件不写死颜色',
    body: '全站颜色走一套语义 token（--site-ink / muted / faint / line / panel / accent / green 等），浅、深、经典三套主题各定义一次。组件只引用 token，不再散落 hex；想调色只改根变量，全站跟随。',
  },
  {
    title: '暖中性基底 + 克制点缀',
    body: '以暖灰（浅色）、暖近黑（深色）作基底，鼠尾草绿与赭紫只做少量点缀。一个页面不堆多种强色，让信息层级而非颜色抢注意力。',
  },
  {
    title: '一处定义，处处跟随',
    body: '主题与阅读底色的切换只动根变量，不逐组件改写。阅读底色（reading-bg）仅在亮色主题生效，暗色恒用自身深色基底——切换主题不会把浅底卡死在暗色上。',
  },
  {
    title: '内容优先，视觉克制',
    body: '列表与卡片低饱和、弱投影、细边框，正文与标题是主角。装饰性渐变、光晕只在首页等少数门面出现，内容页保持安静。',
  },
  {
    title: '资源页不用卡片网格',
    body: '资料、书单、索引类页面优先使用长文、目录、表格、分隔线列表和紧凑链接组织信息；不要把每个条目都做成圆角卡片，也不要用大面积卡片堆叠替代内容结构。',
  },
  {
    title: '三档宽度 + 三态主题',
    body: '页面宽度收敛为 narrow / standard / wide 三档，主题统一为 浅 / 深 / 经典 三态。跨页沿用同一套度量与色板，避免每页各写一套。',
  },
  {
    title: '可达性是底线',
    body: '保证文字对比度、保留 focus-visible 键盘轮廓、尊重 prefers-reduced-motion。好看不能以牺牲可读、可操作为代价。',
  },
]

export default function ChangelogPage() {
  return (
    <PageContainer className="py-8 md:py-10">
      <header className="border-b border-[#dee0db] pb-6 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          Site Changelog · 站点更新记录
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#15140f] dark:text-gray-100 md:text-3xl">
          按周记录这个站点如何长出来
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
          这里既记录站点已经完成的迭代，也保留接下来准备推进的事项。版本号按自然周编号，例如 v2026.22
          表示 2026 年第 22 周；当前版本分为「已做」与「计划」，较早版本仅保留已交付内容。
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
              className="rounded-xl border border-[#dfe0d8] bg-white/[0.72] px-3 py-2 dark:border-[#232c36] dark:bg-[#121821]/[0.72]"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858876] dark:text-[#8e9ab0]">
                {label}
              </dt>
              <dd className="mt-1 text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <details className="mt-8 rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_60%,transparent)] p-5 md:p-6">
        <summary className="cursor-pointer">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--site-faint)]">
            Design Principles · 设计原则
          </span>
          <span className="mt-1 block border-b-0 pb-0 font-serif text-xl font-semibold tracking-wide text-[var(--site-ink)] md:text-2xl">
            这个站点配色与样式的取舍
          </span>
          <span className="mt-1 block max-w-3xl text-[13.5px] leading-7 text-[var(--site-muted)]">
            不是为了好看而堆视觉，而是用一套尽量小的规则让浅色、深色、经典三套主题始终一致、可维护。
          </span>
        </summary>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {DESIGN_PRINCIPLES.map((p, idx) => (
            <li
              key={p.title}
              className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_50%,transparent)] p-4"
            >
              <p className="flex items-baseline gap-2 font-serif text-[15px] font-semibold text-[var(--site-ink)]">
                <span className="font-mono text-[11px] text-[var(--site-accent)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {p.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-[var(--site-muted)]">{p.body}</p>
            </li>
          ))}
        </ul>
      </details>

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
    </PageContainer>
  )
}
