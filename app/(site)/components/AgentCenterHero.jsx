import Link from 'next/link'

import SharePageButton from './SharePageButton'

const CENTERS = [
  { href: '/skill-center', label: 'Skill 中心', short: '怎么做' },
  { href: '/mcp-center', label: 'MCP 中心', short: '连什么' },
  { href: '/prompt-center', label: 'Prompt 中心', short: '怎么说' },
]

export default function AgentCenterHero({ current, eyebrow, title, description, shareText }) {
  return (
    <>
      <header className="mb-5 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#626358] dark:text-gray-400">
              <Link href="/works" className="underline-offset-4 hover:underline">AI 项目</Link>
              <span>/</span>
              <span>{eyebrow}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">[ Agent ]</span>
            </div>
            <h1 className="mb-2 font-serif text-3xl font-semibold tracking-normal text-[#191915] dark:text-gray-100 md:text-4xl">{title}</h1>
            <p className="mb-0 max-w-3xl text-sm leading-6 text-[#43433b] dark:text-gray-300 md:text-base">{description}</p>
          </div>
          <div className="self-start">
            <SharePageButton title={eyebrow} text={shareText} url={current} />
          </div>
        </div>
      </header>

      <nav aria-label="Agent 能力中心" className="mb-8 flex overflow-x-auto border-b border-[#d2d3c8] dark:border-[#283443]">
        {CENTERS.map((center) => {
          const active = center.href === current
          return (
            <Link
              key={center.href}
              href={center.href}
              aria-current={active ? 'page' : undefined}
              className={`relative min-w-28 flex-1 px-2 py-3 no-underline transition-colors hover:!no-underline sm:px-4 ${
                active
                  ? 'text-[#654115] after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:bg-[#8b5a1f] dark:text-[#d2d9a4] dark:after:bg-[#a1ab76] sm:after:inset-x-4'
                  : 'text-[#6e7064] hover:text-[#34362e] dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span className="block text-xs font-semibold sm:text-sm">{center.label}</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.08em] opacity-65 sm:text-[10px]">Agent · {center.short}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
