import Link from 'next/link'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function DirectoryLink({ item, className, children }) {
  if (item.external || isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

export function DirectoryBadge({ badge }) {
  return (
    <span
      className={[
        'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        badge.mono === false ? '' : 'font-mono uppercase tracking-[0.08em]',
        badge.className ||
          'border-[#ded8ca] bg-white/55 text-[#68645a] dark:border-[#303947] dark:bg-[#101721] dark:text-[#aab4c2]',
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

function DirectoryRow({ item, actionLabel }) {
  const badges = item.badges || []

  return (
    <DirectoryLink
      item={item}
      className="group grid gap-1 px-3.5 py-3 no-underline transition hover:bg-[#fffdf7] dark:hover:bg-[#121b26] md:grid-cols-[minmax(0,1fr)_minmax(280px,auto)] md:items-center"
    >
      <div className="min-w-0 md:pr-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="mb-0 text-[15px] font-bold leading-snug text-[#1d1a16] transition group-hover:text-[#2f6f73] dark:text-white dark:group-hover:text-[#77c6c2]">
            {item.title}
          </h3>
          {item.mobileBadge ? <span className="md:hidden"><DirectoryBadge badge={item.mobileBadge} /></span> : null}
          <span className="ml-auto text-[13px] font-semibold text-[#8a6422] transition group-hover:text-[#3a2c14] dark:text-[#d4ae66] dark:group-hover:text-[#f2d8a5] md:hidden">
            {item.actionLabel || actionLabel} →
          </span>
        </div>
        <p className="mb-0 overflow-hidden text-[13px] leading-6 text-[#68665e] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-[#a4adba] md:block md:overflow-visible md:[-webkit-line-clamp:unset]">
          {item.summary}
        </p>
      </div>

      <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex md:justify-end">
        {badges.map((badge) => <DirectoryBadge key={`${item.id}-${badge.label}`} badge={badge} />)}
        <span className="ml-1 text-[13px] font-semibold text-[#8a6422] transition group-hover:text-[#3a2c14] dark:text-[#d4ae66] dark:group-hover:text-[#f2d8a5]">
          {item.actionLabel || actionLabel} →
        </span>
      </div>
    </DirectoryLink>
  )
}

export default function GroupedDirectoryPage({
  eyebrow,
  title,
  description,
  headerActions,
  sections,
  actionLabel = '打开',
}) {
  const total = sections.reduce((count, section) => count + section.items.length, 0)

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <header className="mx-auto max-w-[1100px] px-4 pb-4 pt-9 sm:px-6 lg:px-8">
        <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
          {eyebrow}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-3 font-serif text-[38px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[48px]">
              {title}
            </h1>
            <div className="max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">{description}</div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a877d] dark:text-[#7e8a9b]">
              {sections.length} 类 · {total} 项
            </span>
            {headerActions}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.anchor || section.id}
              className="scroll-mt-[calc(var(--site-header-height)+16px)] grid gap-3 border-t border-[#d8d1c4] pt-6 dark:border-[#27313d] lg:grid-cols-[220px_minmax(0,1fr)]"
            >
              <div>
                <div className="sticky top-[calc(var(--site-header-height)+16px)]">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a6422] dark:text-[#d4ae66]">
                    {section.titleEn}
                  </p>
                  <div className="flex items-baseline gap-2 lg:block">
                    <h2 className="mb-0 text-[20px] font-bold">{section.title}</h2>
                    <span className="text-[12px] text-[#8a877d] dark:text-[#7e8a9b] lg:mt-1 lg:block">
                      {section.items.length} 个
                    </span>
                  </div>
                  <p className="mb-0 mt-2 text-[13px] leading-6 text-[#69665c] dark:text-[#9ca7b6]">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#e8e1d5] overflow-hidden rounded-lg border border-[#ded8ca] bg-white/60 dark:divide-[#252e38] dark:border-[#252e38] dark:bg-[#101720]/[0.72]">
                {section.items.map((item) => (
                  <DirectoryRow key={item.id} item={item} actionLabel={actionLabel} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
