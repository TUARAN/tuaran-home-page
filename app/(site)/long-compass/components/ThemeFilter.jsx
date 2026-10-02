'use client'

import { THEME_COLORS, THEMES } from '../../../../lib/longCompass/schema'

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
    <div className="mt-3 border-t border-[#e7e9e3] pt-3 dark:border-[#252d37] sm:flex sm:items-start sm:gap-5">
      <div className="mb-2 sm:mb-0 sm:w-20 sm:flex-none sm:pt-1.5">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#777a6e] dark:text-[#8e9ab0]">主题筛选</p>
      </div>

      <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="主题筛选">
        <button
          type="button"
          aria-pressed={!hasSelection}
          onClick={onClear}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            !hasSelection
              ? 'border-[#34362c] bg-[#34362c] text-white shadow-sm dark:border-[#d7dccc] dark:bg-[#d7dccc] dark:text-[#111]'
              : 'border-[#dfe1da] bg-transparent text-[#5f6157] hover:bg-white dark:border-[#303846] dark:text-gray-300 dark:hover:bg-[#171e27]'
          }`}
        >
          全部主题
        </button>

        {activeThemes.map((t) => {
          const selected = selectedTheme === t
          return (
            <button
              key={t}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selected
                  ? 'border-[#34362c] bg-[#34362c] text-white shadow-sm dark:border-[#d7dccc] dark:bg-[#d7dccc] dark:text-[#111]'
                  : THEME_COLORS[t] + ' hover:-translate-y-px hover:shadow-sm'
              }`}
            >
              <span>{t}</span>
              <span className={`font-mono text-[10px] ${selected ? 'opacity-70' : 'opacity-60'}`}>{counts[t]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
