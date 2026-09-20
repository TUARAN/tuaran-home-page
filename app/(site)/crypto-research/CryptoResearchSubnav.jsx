import Link from 'next/link'

const items = [
  { id: 'research', href: '/crypto-research', label: '加密调研' },
  { id: 'rss', href: '/crypto-research/rss', label: 'RSS 订阅' },
]

export default function CryptoResearchSubnav({ active }) {
  return (
    <nav aria-label="加密调研" className="mb-7 flex flex-wrap gap-1 border-b border-[#d8ddd9] dark:border-[#303b3a]">
      {items.map((item) => {
        const selected = item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={selected ? 'page' : undefined}
            className={[
              '-mb-px border-b-2 px-3 py-2 text-sm no-underline transition',
              selected
                ? 'border-[#16745b] font-semibold text-[#16745b] dark:border-[#65c8a9] dark:text-[#65c8a9]'
                : 'border-transparent text-[#66706c] hover:text-[#16745b] dark:text-[#a9b5b0] dark:hover:text-[#65c8a9]',
            ].join(' ')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
