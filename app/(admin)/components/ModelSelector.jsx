'use client'

export { buildModelSelectionOptions as buildAdminModelOptions } from '../../../lib/modelSelection'

/** 后台共用的单模型选择器。 */
export default function ModelSelector({
  options = [],
  value = '',
  onChange,
  disabled = false,
  label = '模型',
  variant = 'default',
}) {
  return (
    <label className="block text-[12px] font-semibold text-[#34352f] dark:text-gray-200">
      {label}
      <select
        className={`mt-1 w-full rounded-xl border border-[#cfd2c6] bg-white px-3 text-[13px] text-[#25261f] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-100 dark:focus:ring-emerald-950 ${variant === 'compact' ? 'h-9' : 'h-11 shadow-sm'}`}
        value={value}
        disabled={disabled || !options.length}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {!options.length ? <option value="">暂无可用模型</option> : null}
        {options.map((option) => <option key={option.id} value={option.id}>{option.label} — {option.hint}</option>)}
      </select>
    </label>
  )
}
