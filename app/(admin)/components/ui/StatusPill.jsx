import {
  IconCircleCheck,
  IconAlertTriangle,
  IconCircleX,
  IconCircleDot,
  IconInfoCircle,
} from '@tabler/icons-react'

const TONES = {
  success: {
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    Icon: IconCircleCheck,
  },
  warning: {
    cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    Icon: IconAlertTriangle,
  },
  danger: {
    cls: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
    Icon: IconCircleX,
  },
  info: {
    cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
    Icon: IconInfoCircle,
  },
  neutral: {
    cls: 'border-[#d8dad0] bg-[#f1f2ea] text-[#67695d] dark:border-[#263142] dark:bg-[#151c26] dark:text-gray-400',
    Icon: IconCircleDot,
  },
}

/** 状态胶囊：tone = success | warning | danger | info | neutral */
export default function StatusPill({ tone = 'neutral', children, icon = true, size = 'md' }) {
  const t = TONES[tone] || TONES.neutral
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${pad} ${t.cls}`}>
      {icon ? <t.Icon size={size === 'sm' ? 13 : 14} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
