import Link from 'next/link'

import ArticleComments from './ArticleComments'
import PageContainer from './PageContainer'
import { CONTENT_PIPELINE_TYPE_LABELS, getRelatedContent } from '../../../lib/contentPipeline'

/**
 * 内容页统一互动尾部：相关阅读（跨文章/调研/资源推荐）+ 评论区。
 *
 * contentKey 与评论 articleKey、燃币 resourceKey 同一套约定
 * （'resource:{slug}' / 'research:{cat}:{slug}' / 'article:{slug}'），
 * 挂上这个组件即接入评论 + 相关阅读；解锁与 PV 由页面既有的
 * RanbiPaywall / ContentPvBeacon 负责，互不重复。
 */
export default function ContentEngagement({ contentKey, width = 'narrow', relatedLimit = 4 }) {
  const related = getRelatedContent(contentKey, { limit: relatedLimit })

  return (
    <PageContainer as="section" width={width} className="pb-12">
      {related.length ? (
        <section className="mt-10 rounded-lg border border-[#dee0db] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
            Related
          </p>
          <h2 className="mt-2 text-base font-semibold text-[#444] dark:text-gray-200">相关阅读</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((entry) => (
              <li key={entry.contentKey}>
                <Link
                  href={entry.href}
                  className="block h-full rounded-md border border-transparent px-2 py-2 no-underline transition hover:border-[#dee0db] hover:bg-[#fafbf9] dark:hover:border-gray-700 dark:hover:bg-gray-900"
                >
                  <span className="font-mono text-[11px] text-[#999] dark:text-gray-500">
                    {CONTENT_PIPELINE_TYPE_LABELS[entry.type] || '内容'}
                    {entry.date ? ` · ${entry.date}` : ''}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-[#333] dark:text-gray-200">
                    {entry.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8" id="comments">
        <ArticleComments articleKey={contentKey} />
      </div>
    </PageContainer>
  )
}
