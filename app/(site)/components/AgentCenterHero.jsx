import Link from 'next/link'
import { IconArrowDownRight, IconArrowUpRight, IconSparkles } from '@tabler/icons-react'

import SharePageButton from './SharePageButton'

export default function AgentCenterHero({ current, eyebrow, title, description, shareText, count, countLabel = '个条目', actionLabel = '浏览全部' }) {
  return (
    <header className="surface-inverse relative mb-10 overflow-hidden rounded-[28px] bg-[#171b21] px-6 py-7 text-white shadow-[0_24px_70px_rgba(20,24,30,0.16)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full bg-[#d8b476]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-20 h-80 w-80 rounded-full bg-[#7e9faa]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-12 hidden h-48 w-48 rotate-12 rounded-[40px] border border-white/10 lg:block" />
      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/65">
            <Link href="/capabilities" className="text-white/75 no-underline hover:text-white hover:!no-underline">能力集</Link>
            <span>/</span>
            <span>{eyebrow}</span>
          </div>
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#d9ba83]"><IconSparkles size={15} /> {eyebrow}</p>
          <h1 className="mb-4 max-w-3xl text-4xl font-black leading-[1.13] tracking-[-0.045em] text-white sm:text-5xl lg:text-[58px]">{title}</h1>
          <p className="mb-0 max-w-2xl text-[15px] leading-7 text-white/75 sm:text-base">{description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#items" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e5c99d] px-5 text-sm font-bold text-[#24211c] no-underline transition hover:bg-white hover:!no-underline">{actionLabel}<IconArrowDownRight size={17} /></a>
            <Link href="/capabilities" className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-medium text-white/75 no-underline hover:text-white hover:!no-underline">全部能力 <IconArrowUpRight size={16} /></Link>
          </div>
        </div>
        <div className="flex items-end justify-between gap-5 border-t border-white/15 pt-5 lg:min-w-36 lg:flex-col lg:items-start lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div>
            {count != null ? <strong className="block text-4xl font-black leading-none tracking-tight text-white">{count}</strong> : null}
            <span className="mt-1 block text-xs text-white/55">{countLabel}</span>
          </div>
          <SharePageButton title={eyebrow} text={shareText} url={current} />
        </div>
      </div>
    </header>
  )
}
