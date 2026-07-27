import PageContainer from '../components/PageContainer'
import ChangelogTimelineClient from './ChangelogTimelineClient'
import {
  CHANGELOG as changelog,
  CHANGELOG_TOTAL_COMMITS as totalCommits,
  EARLIEST_CHANGELOG as earliest,
  LATEST_CHANGELOG as latest,
} from '../../../lib/changelogData'

export const dynamic = 'force-static'

export const metadata = {
  title: '站点更新记录',
  description: '从 git 提交历史归纳而来的 2aran.com 站点更新记录，可按周、月、季度和年度查看功能演进与内容建设。',
  alternates: { canonical: '/changelog' },
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
  const activeWeeks = new Set(changelog.map((entry) => entry.week)).size

  return (
    <PageContainer className="py-8 md:py-10">
      <header className="border-b border-[#dee0db] pb-6 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          Site Changelog · 站点更新记录
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#15140f] dark:text-gray-100 md:text-3xl">
          按时间看这个站点如何长出来
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
          这里既记录站点已经完成的迭代，也保留接下来准备推进的事项。默认按自然周查看，也可以切换到月度、
          季度和年度；同一周期内发生的多次更新会自动收拢，不再重复展示多套版本号。
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['起点', earliest.range.split(' 至 ')[0]],
            ['最近', latest.range.split(' 至 ').at(-1)],
            ['活跃周', `${activeWeeks} 周`],
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

      <ChangelogTimelineClient entries={changelog} />
    </PageContainer>
  )
}
