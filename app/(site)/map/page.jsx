import { cookies } from 'next/headers'
import Link from 'next/link'

import { cookieNames, getSecrets, verifySession } from '../../../lib/edgeSession'
import { getNavOverrides } from '../../../lib/navOverrides'
import { isOwnerUser } from '../../../lib/ownerAuth'
import {
  SITE_CHANNELS,
  getChannelAllSections,
  isItemVisibleForAccount,
  resolveItemAudience,
} from '../../../lib/siteNav'
import { getTagToneClass } from '../../../lib/tagTone'

export const metadata = {
  title: '全站地图 · 2aran.com',
  description: '按层级和频道组织的全站入口：主路径、补充索引、权限入口与完整页面结构。',
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getAccountForRequest() {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) return { user: null, isOwner: false }
    const cookieStore = await cookies()
    const token = cookieStore.get(cookieNames.session)?.value
    const payload = await verifySession(token, sessionSecret)
    const user = payload?.user || null
    return { user, isOwner: isOwnerUser(user) }
  } catch {
    return { user: null, isOwner: false }
  }
}

const CHANNEL_STYLES = {
  content: {
    label: 'Knowledge',
    accent: 'bg-[#8a5a14]',
    border: 'border-[#caccb9]',
    soft: 'bg-[#f3f4ec]',
    text: 'text-[#7a4c10]',
  },
  resources: {
    label: 'Archive',
    accent: 'bg-[#3f6878]',
    border: 'border-[#c7dce4]',
    soft: 'bg-[#edf6f8]',
    text: 'text-[#3f6878]',
  },
  tools: {
    label: 'Systems',
    accent: 'bg-[#2f6f73]',
    border: 'border-[#c7dfdd]',
    soft: 'bg-[#eef8f7]',
    text: 'text-[#245b5f]',
  },
  community: {
    label: 'Community',
    accent: 'bg-[#6b5aa6]',
    border: 'border-[#d9d3f0]',
    soft: 'bg-[#f5f2ff]',
    text: 'text-[#554789]',
  },
  about: {
    label: 'Identity',
    accent: 'bg-[#765662]',
    border: 'border-[#ded3d8]',
    soft: 'bg-[#f8f2f4]',
    text: 'text-[#5e434e]',
  },
}

function allItems(channel, account, overrides) {
  return channel.sections.flatMap((section) =>
    section.items
      .filter((item) => isItemVisibleForAccount(item, account, overrides))
      .map((item) => ({
        ...item,
        section: section.title,
        effectiveAudience: resolveItemAudience(item, overrides),
      }))
  )
}

function channelSummary(channel, account, overrides) {
  const items = allItems(channel, account, overrides)
  const primary = items.filter((item) => item.nav !== false)
  const archive = items.filter((item) => item.nav === false)
  const restricted = items.filter((item) => item.effectiveAudience !== 'public')
  const external = items.filter((item) => item.external)
  return {
    channel,
    items,
    primary,
    archive,
    restricted,
    external,
    sections: getChannelAllSections(channel, account, overrides),
  }
}

function LevelCard({ level, title, count, desc, tone = 'default' }) {
  const toneClass = {
    default: 'border-[#d4d6cc] bg-white/80 text-[#1a1b17] dark:border-[#2a3440] dark:bg-[#10161f] dark:text-gray-100',
    strong: 'border-[#b8cfc8] bg-[#eef8f6] text-[#153c3d] dark:border-[#285352] dark:bg-[#0f2023] dark:text-[#b5e0dc]',
    warm: 'border-[#d9c7a8] bg-[#fbf3e5] text-[#6f4710] dark:border-[#4b3a20] dark:bg-[#201911] dark:text-[#e9c78e]',
    quiet: 'border-[#d8d9d1] bg-[#f7f8f5] text-[#56584e] dark:border-[#252e39] dark:bg-[#0f141b] dark:text-[#b9c2d0]',
  }[tone]
  return (
    <article className={`rounded-xl border px-4 py-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">{level}</span>
        <strong className="font-serif text-3xl leading-none tabular-nums">{count}</strong>
      </div>
      <h3 className="mt-3 mb-0 text-[15px] font-semibold">{title}</h3>
      <p className="mt-2 mb-0 text-[12px] leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function CountPill({ children }) {
  return (
    <span className="rounded-full border border-[#d6d8cd] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#606258] dark:border-[#2a3440] dark:bg-[#10161f] dark:text-[#aeb8c8]">
      {children}
    </span>
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
            item.nav === false ? 'bg-[#babcb3] dark:bg-[#4d5665]' : 'bg-[#2f6f73] dark:bg-[#77c6c2]',
          ].join(' ')}
        />
        <span className="truncate font-medium text-[#1a1b17] dark:text-gray-100">{item.label}</span>
        {item.tag ? (
          <span
            className={`shrink-0 rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${getTagToneClass(item.tag)}`}
          >
            {item.tag}
          </span>
        ) : null}
        {item.external ? (
          <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">
            ↗
          </span>
        ) : null}
      </span>
      {!compact && item.desc ? (
        <span className="mt-1 block text-[12px] leading-snug text-[#676960] dark:text-[#9aa4b4]">{item.desc}</span>
      ) : null}
      <span className="mt-1 block truncate font-mono text-[10px] tracking-[0.04em] text-[#a2a499] dark:text-[#657184]">
        {itemHrefText(item.href)}
      </span>
    </>
  )

  const className = [
    'no-external-arrow group block min-w-0 rounded-lg border px-3 py-2 no-underline transition-all',
    item.nav === false
      ? 'border-[#dfe0d8] bg-white/55 hover:border-[#c2c4b7] hover:bg-white dark:border-[#242d38] dark:bg-[#111821]/55 dark:hover:border-[#34404d]'
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

function ChannelNode({ channel, account, overrides }) {
  const style = CHANNEL_STYLES[channel.key] || CHANNEL_STYLES.content
  const summary = channelSummary(channel, account, overrides)
  const total = summary.items.length
  const primary = summary.primary.length
  const archive = summary.archive.length
  const restricted = summary.restricted.length

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
      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a8b7f] dark:text-[#8793a6]">
        {style.label}
      </span>
      <span className="mt-1 block font-serif text-[1.55rem] font-semibold text-[#1a1b17] dark:text-gray-100">
        {channel.label}
      </span>
      <span className="mt-3 flex items-center gap-3 text-[12px] text-[#606258] dark:text-[#a0aaba]">
        <span>{primary} 个主入口</span>
        <span className="h-1 w-1 rounded-full bg-[#a4a699]" />
        <span>{archive} 个补充</span>
      </span>
      <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8793a6]">
        total {total}{restricted ? ` · restricted ${restricted}` : ''}
      </span>
    </Link>
  )
}

function ChannelSection({ channel, account, overrides }) {
  const style = CHANNEL_STYLES[channel.key] || CHANNEL_STYLES.content
  const summary = channelSummary(channel, account, overrides)
  const primary = summary.primary
  const total = summary.items.length
  const visibleSections = summary.sections

  return (
    <section className="border-t border-[#d4d6cc] py-8 dark:border-[#232c36]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${style.accent}`} />
            <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              {channel.key} · {style.label}
            </p>
          </div>
          <h2 className="mb-0 font-serif text-[1.6rem] font-semibold text-[#15140f] dark:text-gray-100">
            {channel.label}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-full border border-[#c6c9bd] bg-white px-3 py-1 text-[#56584e] dark:border-[#2d3744] dark:bg-[#111821] dark:text-[#b9c2d0]">
            主导航 {primary.length}
          </span>
          <span className="rounded-full border border-[#c6c9bd] bg-white px-3 py-1 text-[#56584e] dark:border-[#2d3744] dark:bg-[#111821] dark:text-[#b9c2d0]">
            补充 {summary.archive.length}
          </span>
          <span className="rounded-full border border-[#c6c9bd] bg-white px-3 py-1 text-[#56584e] dark:border-[#2d3744] dark:bg-[#111821] dark:text-[#b9c2d0]">
            当前可见 {total}
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
          <div className="mt-4 flex flex-wrap gap-2">
            <CountPill>sections {visibleSections.length}</CountPill>
            <CountPill>archive {summary.archive.length}</CountPill>
            {summary.external.length ? <CountPill>external {summary.external.length}</CountPill> : null}
            {summary.restricted.length ? <CountPill>restricted {summary.restricted.length}</CountPill> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleSections.map((section) => (
            <div key={section.title} className="rounded-xl border border-[#dfe0d8] bg-white/70 p-4 dark:border-[#232c36] dark:bg-[#10161f]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="mb-0 text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{section.title}</h3>
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#929487] dark:text-[#7f8a9b]">
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

export default async function SiteMapPage() {
  const [account, overrides] = await Promise.all([getAccountForRequest(), getNavOverrides()])
  const summaries = SITE_CHANNELS.map((channel) => channelSummary(channel, account, overrides))
  const totalItems = summaries.reduce((n, summary) => n + summary.items.length, 0)
  const primaryItems = summaries.reduce((n, summary) => n + summary.primary.length, 0)
  const hiddenItems = totalItems - primaryItems
  const sectionCount = summaries.reduce((n, summary) => n + summary.sections.length, 0)
  const restrictedItems = summaries.reduce((n, summary) => n + summary.restricted.length, 0)
  const externalItems = summaries.reduce((n, summary) => n + summary.external.length, 0)

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:py-10">
      <header className="mb-10 overflow-hidden border-b border-[#d4d6cc] pb-8 dark:border-[#232c36]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
              Site Index · Information Architecture
            </p>
            <h1 className="mb-4 font-serif text-[2.25rem] font-semibold leading-tight text-[#1d1a16] dark:text-gray-100 md:text-[3.2rem]">
              全站地图
            </h1>
            <p className="mb-0 max-w-[42rem] text-[15px] leading-[1.9] text-[#53554d] dark:text-gray-300">
              先看层级，再看频道，最后进入完整入口清单。主导航只放高频路径；资源、专题、工具、讨论、站点治理这些变化都在这里按优先级展开。
            </p>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#d4d6cc] bg-white/75 dark:border-[#2a3440] dark:bg-[#10161f] sm:grid-cols-4">
            <div className="border-r border-[#dee0db] p-4 dark:border-[#26313d]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8793a6]">
                Channels
              </span>
              <strong className="mt-2 block text-2xl text-[#1a1b17] dark:text-gray-100">{SITE_CHANNELS.length}</strong>
            </div>
            <div className="border-r border-[#dee0db] p-4 dark:border-[#26313d]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8793a6]">
                Primary
              </span>
              <strong className="mt-2 block text-2xl text-[#1a1b17] dark:text-gray-100">{primaryItems}</strong>
            </div>
            <div className="border-r border-[#dee0db] p-4 dark:border-[#26313d]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8793a6]">
                Archive
              </span>
              <strong className="mt-2 block text-2xl text-[#1a1b17] dark:text-gray-100">{hiddenItems}</strong>
            </div>
            <div className="p-4">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8793a6]">
                Sections
              </span>
              <strong className="mt-2 block text-2xl text-[#1a1b17] dark:text-gray-100">{sectionCount}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Levels
            </p>
            <h2 className="mb-0 font-serif text-[1.5rem] font-semibold text-[#15140f] dark:text-gray-100">
              先按四层读
            </h2>
          </div>
          <p className="mb-0 text-[13px] text-[#676960] dark:text-[#9aa4b4]">当前身份只显示你可访问的入口。</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LevelCard
            level="L0"
            title="频道层"
            count={SITE_CHANNELS.length}
            desc="内容、资源、工具、圈子、关于，决定站点的最高层结构。"
            tone="strong"
          />
          <LevelCard
            level="L1"
            title="主路径"
            count={primaryItems}
            desc="会出现在主导航和频道主路径里，适合第一次访问先点。"
            tone="default"
          />
          <LevelCard
            level="L2"
            title="补充索引"
            count={hiddenItems}
            desc="不进主导航，但保留为专题、归档、长期工具和资料入口。"
            tone="warm"
          />
          <LevelCard
            level="L3"
            title="权限入口"
            count={restrictedItems}
            desc="登录或站长可见入口；普通访客不会看到不可访问的私域链接。"
            tone="quiet"
          />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Top Level
            </p>
            <h2 className="mb-0 font-serif text-[1.5rem] font-semibold text-[#15140f] dark:text-gray-100">
              五个频道，一张结构图
            </h2>
          </div>
          <p className="mb-0 text-[13px] text-[#676960] dark:text-[#9aa4b4]">点击频道进入它的默认入口。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {SITE_CHANNELS.map((channel) => (
            <ChannelNode key={channel.key} channel={channel} account={account} overrides={overrides} />
          ))}
        </div>
      </section>

      <section className="mb-10 overflow-hidden rounded-xl border border-[#d5d7cd] bg-white/70 dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="border-b border-[#e1e2da] px-4 py-3 dark:border-[#26313d]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#858876] dark:text-[#8e9ab0]">
                Channel Matrix
              </p>
              <h2 className="mb-0 text-[1rem] font-semibold text-[#15140f] dark:text-gray-100">频道分级速览</h2>
            </div>
            <p className="mb-0 text-[12px] text-[#676960] dark:text-[#9aa4b4]">
              外链 {externalItems} · 权限入口 {restrictedItems}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e4e6dc] dark:border-[#26313d]">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8793a6]">频道</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8793a6]">主路径</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8793a6]">补充索引</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8793a6]">分组</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8793a6]">定位</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => {
                const style = CHANNEL_STYLES[summary.channel.key] || CHANNEL_STYLES.content
                return (
                  <tr key={summary.channel.key} className="border-b border-[#eceee6] last:border-b-0 dark:border-[#202a35]">
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${style.accent}`} />
                        <div>
                          <div className="font-semibold text-[#15140f] dark:text-gray-100">{summary.channel.label}</div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#929487] dark:text-[#7f8a9b]">{summary.channel.key}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-[#262724] dark:text-gray-200">{summary.primary.length}</td>
                    <td className="px-4 py-4 align-top text-[#262724] dark:text-gray-200">{summary.archive.length}</td>
                    <td className="px-4 py-4 align-top text-[#262724] dark:text-gray-200">{summary.sections.length}</td>
                    <td className="px-4 py-4 align-top text-[#56584e] dark:text-[#b9c2d0]">
                      {summary.primary.slice(0, 3).map((item) => item.label).join(' · ')}
                      {summary.primary.length > 3 ? ' …' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-[#d5d7cd] bg-[#f7f8f5] p-4 dark:border-[#252e39] dark:bg-[#0f141b]">
        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#858876] dark:text-[#8e9ab0]">
              Legend
            </p>
            <h2 className="mb-0 text-[1rem] font-semibold text-[#15140f] dark:text-gray-100">阅读方式</h2>
          </div>
          <div className="grid gap-2 text-[13px] text-[#56584e] dark:text-[#b9c2d0] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2f6f73] dark:bg-[#77c6c2]" />
              主导航入口：高频、精选、优先展示
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#babcb3] dark:bg-[#4d5665]" />
              索引入口：低频、专题调研、归档、工具
            </div>
          </div>
        </div>
      </section>

      <div>
        {SITE_CHANNELS.map((channel) => (
          <ChannelSection key={channel.key} channel={channel} account={account} overrides={overrides} />
        ))}
      </div>
    </div>
  )
}
