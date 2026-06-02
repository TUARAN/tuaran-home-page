'use client'

import { THEME_COLORS } from '../../../../../lib/longCompass/schema'

import { PROSE_CLASS, renderMarkdown } from './markdown'

export default function RecordCard({ record, dense = false }) {
  const padding = dense ? 'p-3' : 'p-4'
  const themes = Array.isArray(record.plain?.theme) ? record.plain.theme : []
  return (
    <article
      className={`rounded-lg border border-[#e8dfd0] bg-white/78 ${padding} dark:border-gray-800 dark:bg-[#121821]/78`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
            {record.plain?.title || '未命名记录'}
          </h2>
          {record.plain?.summary ? (
            <p className="mt-1 text-xs leading-5 text-[#847a67] dark:text-gray-400">{record.plain.summary}</p>
          ) : null}
          {themes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {themes.map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${
                    THEME_COLORS[t] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-[#a09176] dark:text-[#8e9ab0]">
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
