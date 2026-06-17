import Link from 'next/link'

const VARIANTS = {
  default:
    'border border-[#caccc0] bg-white text-[#53554d] hover:border-[#818472] hover:text-[#15140f] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568] dark:hover:text-gray-100',
  primary:
    'border border-[#15140f] bg-[#15140f] text-white hover:bg-[#2b2a23] dark:border-gray-200 dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white',
  ghost:
    'border border-transparent text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
}

/** 统一按钮样式。支持 as Link（传 href）或原生 button。 */
export default function AdminButton({
  variant = 'default',
  size = 'md',
  href,
  className = '',
  children,
  ...rest
}) {
  const sizeCls = size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3 text-sm'
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition disabled:opacity-50 ${sizeCls} ${
    VARIANTS[variant] || VARIANTS.default
  } ${className}`
  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
