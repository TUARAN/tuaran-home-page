'use client'

/**
 * 后台任务共用的模型多选器。业务页面只负责提供可用模型和持久化结果，
 * 选择上限、选中态和无障碍语义统一留在这里。
 */
export default function ModelSelector({
  options = [],
  value = [],
  onChange,
  max = 2,
  disabled = false,
  label = '选择生成模型',
}) {
  const selected = Array.isArray(value) ? value : []

  function toggle(id) {
    if (disabled) return
    if (selected.includes(id)) {
      if (selected.length > 1) onChange(selected.filter((item) => item !== id))
      return
    }
    if (selected.length < max) onChange([...selected, id])
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">{label}</p>
        <span className="text-[11px] tabular-nums text-[#85877c]">已选 {selected.length} / {max}</span>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2" role="group" aria-label={label}>
        {options.map((option) => {
          const active = selected.includes(option.id)
          const limitReached = !active && selected.length >= max
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              disabled={disabled || option.disabled || limitReached}
              onClick={() => toggle(option.id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? 'border-emerald-500 bg-emerald-50 text-[#25261f] shadow-sm dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-white'
                  : 'border-[#d8dad0] bg-white text-[#77796e] hover:border-[#9a9d90] hover:text-[#3f4039] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#96988e]'}`}>
                  {active ? '已选择' : option.badge || ''}
                </span>
              </span>
              {option.hint ? <span className="mt-0.5 block text-[11px] leading-5">{option.hint}</span> : null}
            </button>
          )
        })}
      </div>
      <p className="mb-0 mt-2 text-[11px] leading-5 text-[#85877c]">可同时选择最多 {max} 个模型。自动任务会在已选模型间分配；首选模型调用失败时，会尝试另一个模型。</p>
    </div>
  )
}
