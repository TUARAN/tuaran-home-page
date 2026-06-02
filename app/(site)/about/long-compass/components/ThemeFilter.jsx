'use client'

import { THEME_COLORS, THEMES } from '../../../../../lib/longCompass/schema'

/**
 * theme chip 多选筛选条。
 * - 在当前 kind 下，只有"被使用过的"theme 才会显示
 * - 点 chip 切换选中
 * - 点「全部」清空
 *
 * @param {object} props
 * @param {Set<string>} props.selectedThemes
 * @param {(theme: string) => void} props.onToggle
 * @param {() => void} props.onClear
 * @param {Record<string, number>} props.counts - theme → 当前 kind 下的记录数
 */
export default function ThemeFilter({ selectedThemes, onToggle, onClear, counts }) {
  const activeThemes = THEMES.filter((t) => counts[t] > 0)
  if (activeThemes.length === 0) return null

  const hasSelection = selectedThemes.size > 0

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
        主题
      </span>

      <button
        type="button"
        onClick={onClear}
        className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] transition ${
          !hasSelection
            ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
            : 'border border-[#e8dfd0] text-[#6b5f4d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
        }`}
      >
        全部
      </button>

      {activeThemes.map((t) => {
        const selected = selectedThemes.has(t)
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] transition ${
              selected
                ? 'bg-[#3f3527] text-white shadow-sm dark:bg-gray-200 dark:text-[#111]'
                : THEME_COLORS[t] + ' hover:scale-105'
            }`}
          >
            {t} · {counts[t]}
          </button>
        )
      })}
    </div>
  )
}
