import Link from 'next/link'

function CommunityItem({ item }) {
  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--site-faint)]">{item.kicker}</span>
          <span className="mt-1 block text-[15px] font-semibold leading-snug text-[var(--site-ink)]">{item.title}</span>
        </span>
        {item.status === 'placeholder' ? (
          <span className="shrink-0 rounded border border-[var(--site-line-strong)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--site-muted)]">占位</span>
        ) : (
          <span aria-hidden="true" className="shrink-0 font-mono text-[11px] text-[var(--site-faint)] group-hover:text-[var(--site-ink)]">打开</span>
        )}
      </span>
      <span className="mt-1.5 block text-[13px] leading-5 text-[var(--site-muted)]">{item.note}</span>
    </>
  )

  if (item.status === 'placeholder' || !item.href) {
    return (
      <article className="bg-[var(--page-bg)] px-3 py-3" aria-label={`${item.title}，占位`}>
        {body}
      </article>
    )
  }

  const external = item.href.startsWith('http')
  const className = 'group block bg-[var(--page-bg)] px-3 py-3 no-underline transition-colors hover:bg-[var(--site-panel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--site-ink)]'
  if (external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {body}
    </Link>
  )
}

export default function XiaohongshuCommunityView({ page }) {
  return (
    <>
      <header className="border-b border-[var(--site-line)] pb-5">
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--site-muted)]">
          <Link href="/resources" className="hover:text-[var(--site-ink)]">资源</Link>
          <span aria-hidden="true">/</span>
          <span>小红书社群</span>
          <span aria-hidden="true">·</span>
          <time dateTime={page.date}>{page.date}</time>
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-muted)]">群公告入口</p>
        <h1 className="mt-2 font-serif text-[2rem] font-semibold leading-tight tracking-tight text-[var(--site-ink)] md:text-[2.6rem]">
          {page.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--site-ink)]">{page.purpose}</p>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[var(--site-muted)]">{page.honesty}</p>
        <nav aria-label="页内分区" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          {page.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="text-[var(--site-muted)] underline-offset-4 hover:text-[var(--site-ink)] hover:underline">
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="divide-y divide-[var(--site-line)]">
        {page.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`${section.id}-title`} className="font-serif text-[1.35rem] font-semibold text-[var(--site-ink)] md:text-[1.5rem]">
                {section.title}
              </h2>
              <span className="font-mono text-[11px] text-[var(--site-faint)]">{String(section.items.length).padStart(2, '0')}</span>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-[var(--site-muted)]">{section.note}</p>
            <ul className="mt-3 grid gap-px overflow-hidden border border-[var(--site-line)] bg-[var(--site-line)] md:grid-cols-2">
              {section.items.map((item) => (
                <li key={item.id}>
                  <CommunityItem item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="border-t border-[var(--site-line)] pt-4 text-[13px] text-[var(--site-muted)]">
        <Link href="/resources" className="hover:text-[var(--site-ink)]">全站资源目录 ↗</Link>
      </footer>
    </>
  )
}
