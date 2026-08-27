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
  robots: { index: false, follow: true },
}


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

      <ChangelogTimelineClient entries={changelog} />
    </PageContainer>
  )
}
