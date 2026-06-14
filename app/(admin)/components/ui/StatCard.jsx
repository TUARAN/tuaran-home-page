import Link from 'next/link'

import { AdminIcon } from '../../../../lib/adminIcons'

const TONE_RING = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  info: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-[#7a7c70] dark:text-[#7c8aa0]',
}

/**
 * 指标卡。value 大字 + label 小字，可选 icon / 副标题 / 跳转。
 * tone 仅影响图标与数值强调色。
 */
export default function StatCard({ label, value, sub, icon, tone = 'neutral', href }) {
  const toneCls = TONE_RING[tone] || TONE_RING.neutral
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-[#67695d] dark:text-gray-400">{label}</p>
        {icon ? <AdminIcon name={icon} size={17} className={toneCls} /> : null}
      </div>
      <p className={`mt-2 text-[1.6rem] font-semibold leading-none ${tone === 'neutral' ? 'text-[#15140f] dark:text-gray-100' : toneCls}`}>
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[12px] leading-5 text-[#82847a] dark:text-gray-500">{sub}</p> : null}
    </>
  )
  const cls =
    'block rounded-xl border border-[#e2e3da] bg-white px-4 py-3.5 dark:border-[#1e2733] dark:bg-[#10161f]'
  if (href) {
    return (
      <Link href={href} className={`${cls} transition hover:border-[#b9bbad] dark:hover:border-[#34414f]`}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
