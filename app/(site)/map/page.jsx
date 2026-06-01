import Link from 'next/link'

import { SITE_CHANNELS, getChannelNavSections } from '../../../lib/siteNav'

export const metadata = {
  title: '全站索引 · 2aran.com',
  description: '按信息架构组织的全站入口：主导航精选、频道结构、归档页面。',
}

export const dynamic = 'force-static'

const CHANNEL_STYLES = {
  content: {
    label: 'Knowledge',
    accent: 'bg-[#8a5a14]',
    border: 'border-[#ead7b9]',
    soft: 'bg-[#fff8ec]',
    text: 'text-[#7a4c10]',
  },
  projects: {
    label: 'Systems',
    accent: 'bg-[#2f6f73]',
    border: 'border-[#c7dfdd]',
    soft: 'bg-[#eef8f7]',
    text: 'text-[#245b5f]',
  },
  services: {
    label: 'Business',
    accent: 'bg-[#6b5aa6]',
    border: 'border-[#d9d3f0]',
    soft: 'bg-[#f5f2ff]',
    text: 'text-[#554789]',
  },
  about: {
    label: 'Identity',
    accent: 'bg-[#9a4f62]',
    border: 'border-[#ead1d8]',
    soft: 'bg-[#fff1f4]',
    text: 'text-[#7d3d4e]',
  },
}

function allItems(channel) {
  return channel.sections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })))
}

function navItems(channel) {
  return getChannelNavSections(channel).flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.title }))
  )
}

function itemHrefText(href) {
  return href.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function IndexLink({ item, compact = false }) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={[
            'h-2 w-2 shrink-0 rounded-full',
            item.nav === false ? 'bg-[#c8c1b3] dark:bg-[#4d5665]' : 'bg-[#2f6f73] dark:bg-[#77c6c2]',
          ].join(' ')}
        />
        <span className="truncate font-medium text-[#211d17] dark:text-gray-100">{item.label}</span>
        {item.tag ? (
          <span className="shrink-0 rounded-full bg-[#fde6c6] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]">
            {item.tag}
          </span>
        ) : null}
        {item.external ? (
          <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-[#9c8f79] dark:text-[#8e9ab0]">
            ↗
          </span>
        ) : null}
      </span>
      {!compact && item.desc ? (
        <span className="mt-1 block text-[12px] leading-snug text-[#756e60] dark:text-[#9aa4b4]">{item.desc}</span>
      ) : null}
      <span className="mt-1 block truncate font-mono text-[10px] tracking-[0.04em] text-[#b3aa99] dark:text-[#657184]">
        {itemHrefText(item.href)}
      </span>
    </>
  )

  const className = [
    'no-external-arrow group block min-w-0 rounded-lg border px-3 py-2 no-underline transition-all',
    item.nav === false
      ? 'border-[#ebe4d8] bg-white/55 hover:border-[#d7cbb7] hover:bg-white dark:border-[#242d38] dark:bg-[#111821]/55 dark:hover:border-[#34404d]'
      : 'border-[#cddfda] bg-white shadow-[0_8px_20px_rgba(40,76,73,0.07)] hover:-translate-y-0.5 hover:border-[#9bc5be] dark:border-[#2b4a4a] dark:bg-[#121b22] dark:hover:border-[#47706e]',
  ].join(' ')

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
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

function ChannelNode({ channel }) {
  const style = CHANNEL_STYLES[channel.key] || CHANNEL_STYLES.content
  const total = allItems(channel).length
  const primary = navItems(channel).length

  return (
    <Link
      href={channel.href}
      className={[
        'group relative min-h-[138px] rounded-xl border p-4 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(55,45,28,0.10)] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]',
        style.border,
        style.soft,
        'dark:border-[#2a3440] dark:bg-[#111821]',
      ].join(' ')}
    >
      <span className={`mb-5 block h-1.5 w-12 rounded-full ${style.accent}`} />
      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#9e927f] dark:text-[#8793a6]">
        {style.label}
      </span>
      <span className="mt-1 block font-serif text-[1.55rem] font-semibold text-[#211d17] dark:text-gray-100">
        {channel.label}
      </span>
      <span className="mt-3 flex items-center gap-3 text-[12px] text-[#6f6758] dark:text-[#a0aaba]">
        <span>{primary} 个主入口</span>
        <span className="h-1 w-1 rounded-full bg-[#b8ad99]" />
        <span>{total} 个索引项</span>
      </span>
    </Link>
  )
}

function ChannelSection({ channel }) {
  const style = CHANNEL_STYLES[channel.key] || CHANNEL_STYLES.content
  const primary = navItems(channel)
  const total = allItems(channel).length

  return (
    <section className="border-t border-[#e4dccc] py-8 dark:border-[#232c36]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${style.accent}`} />
            <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
              {channel.key} · {style.label}
            </p>
          </div>
          <h2 className="mb-0 font-serif text-[1.6rem] font-semibold text-[#221f19] dark:text-gray-100">
            {channel.label}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-full border border-[#d8cfbd] bg-white px-3 py-1 text-[#665d4e] dark:border-[#2d3744] dark:bg-[#111821] dark:text-[#b9c2d0]">
            主导航 {primary.length}
          </span>
          <span className="rounded-full border border-[#d8cfbd] bg-white px-3 py-1 text-[#665d4e] dark:border-[#2d3744] dark:bg-[#111821] dark:text-[#b9c2d0]">
            全量 {total}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className={`rounded-xl border ${style.border} ${style.soft} p-4 dark:border-[#2a3440] dark:bg-[#111821]`}>
          <p className={`mb-3 font-mono text-[11px] uppercase tracking-[0.18em] ${style.text} dark:text-[#aeb8c8]`}>
            Primary Path
          </p>
          <div className="space-y-2">
            {primary.map((item) => (
              <IndexLink key={item.href + item.label} item={item} compact />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {channel.sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-[#ece5d8] bg-white/70 p-4 dark:border-[#232c36] dark:bg-[#10161f]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="mb-0 text-[15px] font-semibold text-[#221f19] dark:text-gray-100">{section.title}</h3>
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#a79b87] dark:text-[#7f8a9b]">
                  {section.items.length} items
                </span>
              </div>
              <div className="grid gap-2">
                {section.items.map((item) => (
                  <IndexLink key={item.href + item.label} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function SiteMapPage() {
  const totalItems = SITE_CHANNELS.reduce((n, channel) => n + allItems(channel).length, 0)
  const primaryItems = SITE_CHANNELS.reduce((n, channel) => n + navItems(channel).length, 0)
  const hiddenItems = totalItems - primaryItems

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:py-10">
      <header className="mb-10 overflow-hidden border-b border-[#e4dccc] pb-8 dark:border-[#232c36]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0]">
              Site Index · Information Architecture
            </p>
            <h1 className="mb-4 font-serif text-[2.25rem] font-semibold leading-tight text-[#1d1a16] dark:text-gray-100 md:text-[3.2rem]">
              全站索引
            </h1>
            <p className="mb-0 max-w-[42rem] text-[15px] leading-[1.9] text-[#5f5a4d] dark:text-gray-300">
              主导航只保留高频入口；完整页面、专题、工具和归档内容在这里按频道展开。把它当成这个站点的信息架构视图，而不是一张普通链接表。
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#e4dccc] bg-white/75 dark:border-[#2a3440] dark:bg-[#10161f]">
            <div className="border-r border-[#e8dfd0] p-4 dark:border-[#26313d]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8f79] dark:text-[#8793a6]">
                Channels
              </span>
              <strong className="mt-2 block text-2xl text-[#211d17] dark:text-gray-100">{SITE_CHANNELS.length}</strong>
            </div>
            <div className="border-r border-[#e8dfd0] p-4 dark:border-[#26313d]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8f79] dark:text-[#8793a6]">
                Primary
              </span>
              <strong className="mt-2 block text-2xl text-[#211d17] dark:text-gray-100">{primaryItems}</strong>
            </div>
            <div className="p-4">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8f79] dark:text-[#8793a6]">
                Archive
              </span>
              <strong className="mt-2 block text-2xl text-[#211d17] dark:text-gray-100">{hiddenItems}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
              Top Level
            </p>
            <h2 className="mb-0 font-serif text-[1.5rem] font-semibold text-[#221f19] dark:text-gray-100">
              四个频道，一张结构图
            </h2>
          </div>
          <p className="mb-0 text-[13px] text-[#756e60] dark:text-[#9aa4b4]">点击频道进入它的默认入口。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SITE_CHANNELS.map((channel) => (
            <ChannelNode key={channel.key} channel={channel} />
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-[#e5dccd] bg-[#fcfaf5] p-4 dark:border-[#252e39] dark:bg-[#0f141b]">
        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#a09176] dark:text-[#8e9ab0]">
              Legend
            </p>
            <h2 className="mb-0 text-[1rem] font-semibold text-[#221f19] dark:text-gray-100">阅读方式</h2>
          </div>
          <div className="grid gap-2 text-[13px] text-[#665d4e] dark:text-[#b9c2d0] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2f6f73] dark:bg-[#77c6c2]" />
              主导航入口：高频、精选、优先展示
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#c8c1b3] dark:bg-[#4d5665]" />
              索引入口：低频、专题、归档、工具
            </div>
          </div>
        </div>
      </section>

      <div>
        {SITE_CHANNELS.map((channel) => (
          <ChannelSection key={channel.key} channel={channel} />
        ))}
      </div>
    </div>
  )
}
