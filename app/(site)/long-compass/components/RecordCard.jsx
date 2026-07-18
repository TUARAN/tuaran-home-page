'use client'

import { THEME_COLORS } from '../../../../lib/longCompass/schema'

import { PROSE_CLASS, renderMarkdown } from './markdown'

export default function RecordCard({ record, dense = false, expanded = false, onToggle }) {
  const padding = dense ? 'p-3' : 'p-4'
  const themes = Array.isArray(record.plain?.theme) ? record.plain.theme : []
  return (
    <article
      className={`rounded-lg border border-[#dee0db] bg-white/[0.78] ${padding} dark:border-gray-800 dark:bg-[#121821]/[0.78]`}
    >
      <button
        type="button"
        onClick={() => onToggle?.(record.id)}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-start justify-between gap-3 rounded-md text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#8b5a1f] dark:focus-visible:ring-[#d7a85c]"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">
            {record.plain?.title || '未命名记录'}
          </h2>
          {record.plain?.summary ? (
            <p className="mt-1 text-xs leading-5 text-[#717367] dark:text-gray-400">{record.plain.summary}</p>
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
        <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-[#858876] dark:text-[#8e9ab0]">
          {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
          <span className="rounded border border-[#d8dad2] px-1.5 py-0.5 dark:border-[#344052]">
            {expanded ? '收起' : '展开'}
          </span>
        </span>
      </button>
      {expanded ? (
        <div
          className={PROSE_CLASS}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(record.plain?.content) }}
        />
      ) : null}
    </article>
  )
}
