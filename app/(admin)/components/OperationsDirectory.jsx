import Link from 'next/link'

import { listOperationsDirectory } from '../../../lib/admin/adminRoutes'

/**
 * 现场运行和检查记录共用的目录。授权实验不出现在这组胶囊里。
 * 两组分开排，避免异常、探测、公告、用量和定期检查挤在同一行。
 */
export default function OperationsDirectory({ activeHref }) {
  const groups = listOperationsDirectory()

  return (
    <nav
      aria-label="运行与检查"
      className="mb-6 grid gap-4 border-b border-[#d9d9cf] pb-5 dark:border-[#26313e] md:grid-cols-2"
    >
      {groups.map((group) => (
        <div key={group.id}>
          <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#929487] dark:text-[#667286]">
            {group.label}
          </p>
          {group.desc ? (
            <p className="mt-1 text-[12px] leading-5 text-[#77796d] dark:text-gray-400">{group.desc}</p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {group.items.map((item) => {
              const active = item.href === activeHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]'
                      : 'border text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
