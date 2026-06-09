import { resolveCanvasProvenance } from '../../../lib/canvasProvenance'

const SIZE_CLASS = {
  sm: 'px-1.5 py-px text-[10px] tracking-[0.12em]',
  md: 'px-2 py-[1px] text-[11px] tracking-[0.14em]',
}

/**
 * 标记「先在 Cursor Canvas 原型，再落地为站内工程页」。
 * @param {{ canvasId?: string, href?: string, size?: 'sm' | 'md', className?: string }} props
 */
export default function CanvasOriginBadge({ canvasId, href, size = 'md', className = '' }) {
  const provenance = resolveCanvasProvenance({ canvasId, href })
  if (!provenance) return null

  return (
    <span
      title={provenance.note}
      className={[
        'inline-flex shrink-0 items-center rounded-full border border-[#d4dce8] bg-[#eef2f8] font-mono uppercase text-[#3b4f73]',
        'dark:border-[#2a3448] dark:bg-[#151d28] dark:text-[#9db0d8]',
        SIZE_CLASS[size] || SIZE_CLASS.md,
        className,
      ].join(' ')}
    >
      {provenance.label}
    </span>
  )
}
