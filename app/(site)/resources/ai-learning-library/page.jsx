import Link from 'next/link'

import { AI_LEARNING_BOOKS, AI_LEARNING_LIBRARY_META } from '../../../../lib/aiLearningLibraryData'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import AiLearningLibrary from './AiLearningLibrary'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'ai-learning-library'

export const metadata = {
  title: '安东尼学 AI｜AI 学习资料与经典书目索引',
  description: '按机器学习、深度学习、自然语言处理、计算机视觉、推荐系统和数据分析等方向整理的 AI 学习书目与资料入口。',
  keywords: ['AI 学习', '机器学习', '深度学习', 'NLP', '计算机视觉', 'AI 书单', '学习资料'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: {
    title: '安东尼学 AI｜AI 学习资料与经典书目索引',
    description: '16 本经典 AI 书目，覆盖基础理论、机器学习、深度学习、NLP、CV 与工程实践。',
    url: `https://2aran.com/resources/${RESOURCE_SLUG}`,
    type: 'website',
  },
}

export default function AiLearningLibraryPage() {
  const categoryCount = new Set(AI_LEARNING_BOOKS.map((book) => book.category)).size

  return (
    <>
      <PageContainer width="standard" className="py-8 md:py-10">
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

        <header className="overflow-hidden rounded-3xl border border-[#dfe5ea] bg-[linear-gradient(145deg,#f7fbff_0%,#f8f5ff_55%,#fffaf0_100%)] p-6 dark:border-gray-800 dark:bg-[linear-gradient(145deg,#111923_0%,#171526_55%,#1d1810_100%)] md:p-9">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#6d7b8c] dark:text-gray-400">
            <Link href="/articles?tab=resources" className="hover:text-[#2d3e50] dark:hover:text-white">内容 · 资源</Link>
            <span>／</span>
            <span>AI 学习</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-7 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171b24] text-2xl text-white shadow-lg dark:bg-white dark:text-gray-950" aria-hidden="true">AI</div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#18212b] dark:text-white md:text-5xl">安东尼学 AI</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6f7f] dark:text-gray-300 md:text-base">
                把散落的 AI 经典书目整理成一张可检索的学习地图，从基础理论到机器学习、NLP、计算机视觉和工程实战，按方向找到下一本值得读的资料。
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 text-center shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <strong className="block text-2xl text-[#18212b] dark:text-white">{AI_LEARNING_BOOKS.length}</strong>
                <span className="text-[11px] text-[#7b8997]">经典书目</span>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 text-center shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <strong className="block text-2xl text-[#18212b] dark:text-white">{categoryCount}</strong>
                <span className="text-[11px] text-[#7b8997]">学习方向</span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <a href={AI_LEARNING_LIBRARY_META.sourceSite} target="_blank" rel="noreferrer" className="rounded-lg bg-[#18212b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200">访问原资料站 ↗</a>
            <a href={AI_LEARNING_LIBRARY_META.sourceRepo} target="_blank" rel="noreferrer" className="rounded-lg border border-[#cfd9e2] bg-white/60 px-4 py-2.5 text-sm font-medium text-[#506171] transition hover:border-[#8da0b1] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">GitHub 源项目 ↗</a>
          </div>
        </header>

        <aside className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200" aria-label="版权说明">
          <div className="flex gap-3">
            <span className="text-lg" aria-hidden="true">⚠️</span>
            <div>
              <h2 className="text-sm font-bold">版权与使用说明</h2>
              <p className="mt-1 text-sm leading-6">
                本页面仅做书目整理与学习交流，资源来源于网络，版权归原作者及出版机构所有。<strong>仅分享学习，无商业用途，侵权删除。</strong>
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300/80">请优先购买正版或使用作者、出版社提供的合法版本；如有版权异议，请通过本站联系入口告知处理。</p>
            </div>
          </div>
        </aside>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ['01', '建立基础', '先读数学、统计学习与机器学习通识，理解模型训练的共同底座。'],
            ['02', '选择方向', '按 NLP、计算机视觉、推荐系统或数据分析进入专项学习。'],
            ['03', '动手实践', '结合 Python 与 TensorFlow 实战资料，把算法落到完整项目。'],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-[#e3e6e8] bg-[#fafafa] p-4 dark:border-gray-800 dark:bg-gray-900/60">
              <span className="font-mono text-xs text-[#9a7a37] dark:text-amber-400">{number}</span>
              <h2 className="mt-2 text-base font-semibold text-[#27313b] dark:text-gray-100">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#6d7883] dark:text-gray-400">{description}</p>
            </article>
          ))}
        </section>

        <AiLearningLibrary books={AI_LEARNING_BOOKS} copyrightNotice={AI_LEARNING_LIBRARY_META.copyrightNotice} />

        <footer className="mt-10 border-t border-[#e3e6e8] pt-5 text-xs leading-6 text-[#7b858f] dark:border-gray-800 dark:text-gray-500">
          <p><strong className="text-[#4b5660] dark:text-gray-300">版权声明：</strong>仅分享学习，无商业用途，侵权删除。</p>
          <p>
            当前索引同步自源项目版本{' '}
            <a href={`${AI_LEARNING_LIBRARY_META.sourceRepo}/commit/${AI_LEARNING_LIBRARY_META.sourceCommit}`} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#333] dark:hover:text-gray-200">
              {AI_LEARNING_LIBRARY_META.sourceCommit.slice(0, 7)}
            </a>
            。版权反馈可前往 <Link href="/help#contact" className="underline underline-offset-4 hover:text-[#333] dark:hover:text-gray-200">联系说明</Link>。
          </p>
        </footer>
      </PageContainer>

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
