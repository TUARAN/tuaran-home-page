import Link from 'next/link'

// 喜欢 / 收藏是封面装饰，不绑定真实互动，也不展示数量。
const TONES = [
  { bg: 'bg-[#ffd5df]', fg: 'text-[#9d2946]', height: 'h-[7.25rem]' },
  { bg: 'bg-[#ffe3c4]', fg: 'text-[#94501f]', height: 'h-[9.25rem]' },
  { bg: 'bg-[#ffd9cf]', fg: 'text-[#9a3d32]', height: 'h-[8rem]' },
  { bg: 'bg-[#f8d7e6]', fg: 'text-[#873a5c]', height: 'h-[10rem]' },
  { bg: 'bg-[#ffe8b5]', fg: 'text-[#8a5a10]', height: 'h-[7.75rem]' },
  { bg: 'bg-[#ffd0dc]', fg: 'text-[#a12b4a]', height: 'h-[9rem]' },
]

function Decorations() {
  return (
    <span className="inline-flex items-center gap-2 text-[#e85a78]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.65-7 9-7 9z" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h9a1 1 0 0 1 1 1v15l-5.5-3.2L6 20V5a1 1 0 0 1 1-1z" />
      </svg>
    </span>
  )
}

function NoteCard({ item, tone }) {
  const placeholder = item.status === 'placeholder' || !item.href
  const body = (
    <>
      <div className={`relative flex flex-col justify-between overflow-hidden p-3 ${tone.bg} ${tone.height}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 rounded-full bg-white/50" />
        <span className="relative flex items-start justify-between gap-2">
          <span className="text-[28px] leading-none" aria-hidden="true">{item.emoji}</span>
          {placeholder ? (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#c23b58]">陆续补充</span>
          ) : (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[#a84860]">笔记</span>
          )}
        </span>
        <span className={`relative text-[22px] font-semibold leading-none ${tone.fg}`}>{item.cover}</span>
      </div>
      <div className="px-3 pb-3 pt-2.5">
        <h3 className="mb-0 text-[14px] font-semibold leading-snug text-[#3a2a2e]">{item.title}</h3>
        <span className="mt-1 block text-[12px] leading-5 text-[#6f4552]">{item.note}</span>
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffd0db] text-[10px] font-semibold text-[#c23b58]">燃</span>
            <span className="truncate text-[11px] text-[#7a4e5a]">{item.kicker}</span>
          </span>
          <Decorations />
        </span>
      </div>
    </>
  )

  const className = 'block overflow-hidden rounded-[18px] bg-white text-inherit no-underline shadow-[0_8px_22px_rgba(180,70,95,0.12)]'
  if (placeholder) {
    return (
      <article className={className} aria-label={`${item.title}，陆续补充`}>
        {body}
      </article>
    )
  }

  const external = item.href.startsWith('http')
  const linkClass = `${className} transition hover:shadow-[0_12px_28px_rgba(180,70,95,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e85a78]`
  if (external) {
    return (
      <a href={item.href} className={linkClass} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return (
    <Link href={item.href} className={linkClass}>
      {body}
    </Link>
  )
}

export default function XiaohongshuCommunityView({ page }) {
  return (
    <div className="rounded-[28px] bg-[linear-gradient(180deg,#ffe4eb_0%,#fff6f4_240px)] px-3 py-5 text-[#3a2a2e] sm:px-5 sm:py-6">
      <header>
        <p className="mb-0 flex flex-wrap items-center gap-2 text-[12px] text-[#7a4e5a]">
          <Link href="/resources" className="no-underline hover:text-[#c23b58]">资源</Link>
          <span aria-hidden="true">/</span>
          <span>小红书社群</span>
          <span aria-hidden="true">·</span>
          <time dateTime={page.date}>{page.date}</time>
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffd0db] text-[18px] font-semibold text-[#c23b58]">燃</span>
          <div className="min-w-0">
            <p className="mb-0 text-[12px] text-[#9a3d52]">涂阿燃 · 群公告</p>
            <h1 className="mb-0 mt-0.5 text-[1.7rem] font-semibold leading-tight tracking-tight text-[#3a2a2e] sm:text-[2rem]">
              {page.title}
            </h1>
          </div>
        </div>
        <p className="mb-0 mt-3 max-w-xl text-[15px] leading-6 text-[#3a2a2e]">{page.purpose}</p>
        <p className="mb-0 mt-1 max-w-xl text-[13px] leading-5 text-[#6f4552]">{page.honesty}</p>
        <nav aria-label="页内分区" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {page.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#c23b58] no-underline shadow-[0_4px_12px_rgba(180,70,95,0.08)] hover:bg-[#fff0f3]"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-5 space-y-6">
        {page.sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`${section.id}-title`} className="mb-0 flex items-center gap-2 text-[1.15rem] font-semibold text-[#3a2a2e]">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#e85a78]" />
                {section.title}
              </h2>
              <span className="text-[12px] text-[#7a4e5a]">{section.items.length} 篇</span>
            </div>
            <p className="mb-0 mt-1 text-[13px] leading-5 text-[#6f4552]">{section.note}</p>
            <ul className="mt-3 columns-2 gap-2.5 p-0 md:columns-3">
              {section.items.map((item, itemIndex) => (
                <li key={item.id} className="mb-2.5 break-inside-avoid">
                  <NoteCard item={item} tone={TONES[(sectionIndex * 2 + itemIndex) % TONES.length]} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-2 border-t border-[#f3d5dc] pt-4">
        <Link href="/resources" className="inline-flex rounded-full bg-white px-4 py-2 text-[13px] text-[#c23b58] no-underline shadow-[0_4px_12px_rgba(180,70,95,0.08)] hover:bg-[#fff0f3]">
          回资源目录
        </Link>
      </footer>
    </div>
  )
}
