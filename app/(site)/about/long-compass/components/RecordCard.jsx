'use client'

import { PROSE_CLASS, renderMarkdown } from './markdown'

export default function RecordCard({ record, dense = false }) {
  const padding = dense ? 'p-3' : 'p-4'
  return (
    <article
      className={`rounded-lg border border-[#e8dfd0] bg-white/78 ${padding} dark:border-gray-800 dark:bg-[#121821]/78`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
            {record.plain?.title || '未命名记录'}
          </h2>
          {record.plain?.summary ? (
            <p className="mt-1 text-xs leading-5 text-[#847a67] dark:text-gray-400">{record.plain.summary}</p>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-[#a09176] dark:text-[#8e9ab0]">
          {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
      <div
        className={PROSE_CLASS}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(record.plain?.content) }}
      />
    </article>
  )
}
