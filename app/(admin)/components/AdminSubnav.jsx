import Link from 'next/link'

export default function AdminSubnav({ label, items, activeId }) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2 border-b border-[#d9d9cf] pb-4 dark:border-[#26313e]">
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <Link
            key={item.id}
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
    </nav>
  )
}
