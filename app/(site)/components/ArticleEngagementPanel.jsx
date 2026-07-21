import Link from 'next/link'

import { CONTENT_PIPELINE_TYPE_LABELS, getRelatedContent } from '../../../lib/contentPipeline'
import ArticleLikeButton from './ArticleLikeButton'

export default function ArticleEngagementPanel({ articleKey, related: relatedProp, relatedLimit = 4 }) {
  const related = relatedProp || getRelatedContent(articleKey, { limit: relatedLimit })

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <section className="rounded-lg border border-[#dee0db] bg-[#fafbf9] p-4 dark:border-gray-800 dark:bg-[#0f141b]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">Support</p>
        <h2 className="mt-2 text-[15px] font-semibold text-[#444] dark:text-gray-200">支持这篇文章</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#777a6f] dark:text-[#8a93a3]">
          一下点赞、一句评论，都是对继续写下去的支持。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ArticleLikeButton articleKey={articleKey} />
          <a href="#comments" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#caccc0] bg-white px-3.5 text-[13.5px] font-medium text-[#4a4c42] no-underline transition-all hover:-translate-y-px hover:border-[#9ca08c] hover:text-[#15140f] hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.2 5.4a5.5 5.5 0 0 1 5.6-3.1h.4a5.6 5.6 0 0 1 5.6 5.6v.2a5.6 5.6 0 0 1-5.6 5.6H8l-3.7 2v-3.5a5.6 5.6 0 0 1-.1-6.8Z" />
            </svg>
            <span>评论</span>
          </a>
        </div>
      </section>

      {related.length ? (
        <section className="rounded-lg border border-[#dee0db] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">Related</p>
          <h2 className="mt-2 text-base font-semibold text-[#444] dark:text-gray-200">相关阅读</h2>
          <ul className="mt-3 space-y-2">
            {related.map((entry) => (
              <li key={entry.contentKey || `${entry.category}:${entry.slug}`}>
                <Link href={entry.href || `/articles/research/${entry.category}/${entry.slug}`} className="block rounded-md border border-transparent px-2 py-2 no-underline transition hover:border-[#dee0db] hover:bg-[#fafbf9] dark:hover:border-gray-700 dark:hover:bg-gray-900">
                  <span className="font-mono text-[11px] text-[#999] dark:text-gray-500">
                    {CONTENT_PIPELINE_TYPE_LABELS[entry.type] || (entry.category ? '分析' : '内容')}
                    {entry.dateLabel || entry.date ? ` · ${entry.dateLabel || entry.date}` : ''}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-[#333] dark:text-gray-200">{entry.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}
