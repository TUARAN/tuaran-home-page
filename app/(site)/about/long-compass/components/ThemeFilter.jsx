'use client'

import { THEME_COLORS, THEMES } from '../../../../../lib/longCompass/schema'

/**
 * theme chip 单选筛选条（互斥，tab 语义）。
 * - 在当前 kind 下，只有"被使用过的"theme 才会显示
 * - 点 chip：如果已选 → 取消（回到「全部」）；否则替换当前选择
 * - 点「全部」：清空选择
 *
 * 设计选择：曾用 Set 多选 + AND 交集，但常常归零（每条 theme 只有 1-3 个）。
 *           改成单选互斥，跟 kind tab 一致，UX 更直观。
 *
 * @param {object} props
 * @param {string | null} props.selectedTheme - 当前选中的 theme（null = 全部）
 * @param {(theme: string) => void} props.onSelect - 点击 chip 时回调
 * @param {() => void} props.onClear - 点「全部」时回调
 * @param {Record<string, number>} props.counts - theme → 当前 kind 下的记录数
 */
export default function ThemeFilter({ selectedTheme, onSelect, onClear, counts }) {
  const activeThemes = THEMES.filter((t) => counts[t] > 0)
  if (activeThemes.length === 0) return null

  const hasSelection = selectedTheme !== null && selectedTheme !== undefined

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
        const selected = selectedTheme === t
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
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
