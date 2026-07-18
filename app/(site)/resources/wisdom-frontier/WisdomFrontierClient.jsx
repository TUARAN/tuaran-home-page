'use client'

import Link from 'next/link'
import {
  IconArrowUpRight,
  IconBook2,
  IconChevronDown,
  IconMessageCircle,
  IconRadar,
  IconSearch,
  IconSparkles,
  IconTrophy,
  IconX,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { WISDOM_AWARDS, WISDOM_CATEGORIES, WISDOM_LEARNING_PATHS, WISDOM_TRACKING, WISDOM_FRONTIER_UPDATED_AT } from '../../../../lib/wisdomFrontierData'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'

const FEATURED_IDS = ['nobel-medicine', 'fields', 'turing', 'pritzker', 'world-food', 'wise', 'breakthrough', 'pulitzer']

function AwardCard({ award, category }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="group border-b border-[var(--site-line)] py-5 first:pt-0 last:border-0 last:pb-0">
      <button type="button" className="w-full text-left" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <div className="flex items-start gap-4">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold leading-6 text-[var(--site-ink)]">{award.title}</h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--site-faint)]">{award.en} · 始于 {award.since}</p>
              </div>
              <IconChevronDown size={16} className={`mt-1 shrink-0 text-[var(--site-faint)] transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{award.scope}</p>
          </div>
        </div>
      </button>

      {open ? (
        <div className="ml-[26px] mt-4 border-l-2 pl-4" style={{ borderColor: category.color }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">代表人物 / 作品</p>
          <p className="mt-1 text-sm font-semibold text-[var(--site-ink)]">{award.representative}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{award.achievement}</p>
          <a href={award.official} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--site-accent)] hover:text-[var(--site-accent-strong)]">
            官方资料 <IconArrowUpRight size={13} />
          </a>
        </div>
      ) : null}
    </article>
  )
}

export default function WisdomFrontierClient() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categoryMap = useMemo(() => Object.fromEntries(WISDOM_CATEGORIES.map((item) => [item.id, item])), [])
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return WISDOM_AWARDS.filter((award) => {
      if (activeCategory !== 'all' && award.category !== activeCategory) return false
      if (!keyword) return true
      const haystack = [award.title, award.en, award.scope, award.representative, award.achievement, categoryMap[award.category]?.name].join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [activeCategory, categoryMap, query])

  const grouped = WISDOM_CATEGORIES.map((category) => ({ category, awards: filtered.filter((award) => award.category === category.id) })).filter((group) => group.awards.length)
  const featured = FEATURED_IDS.map((id) => WISDOM_AWARDS.find((award) => award.id === id)).filter(Boolean)

  function clearFilters() {
    setQuery('')
    setActiveCategory('all')
  }

  return (
    <>
      <PageContainer width="standard" className="py-8 md:py-11">
        <ContentPvBeacon category="resource" slug="wisdom-frontier" />

        <header className="relative overflow-hidden rounded-[28px] border border-[#d9d5ca] bg-[#f5f1e8] px-5 py-7 dark:border-[#3b3832] dark:bg-[#191816] md:px-9 md:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#b6965c]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-14 h-48 w-48 rounded-full border border-[#b6965c]/30" />
          <div aria-hidden="true" className="pointer-events-none absolute right-10 top-2 h-24 w-24 rounded-full bg-[#b6965c]/10 blur-2xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7c715f] dark:text-[#ada28f]">
              <Link href="/articles?tab=resources" className="hover:text-[var(--site-ink)]">专题 · 资源</Link>
              <span>/</span>
              <span>长期知识工程</span>
              <span>/</span>
              <ContentPvBeacon category="resource" slug="wisdom-frontier" display />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#b6965c]/50 bg-[#fffaf0] text-[#9b7435] dark:bg-[#27231d] dark:text-[#d5b878]"><IconSparkles size={22} /></span>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-[#9b7435] dark:text-[#d5b878]">The frontier of human wisdom</p>
                <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.08em] text-[#28251f] dark:text-[#f2eee6] md:text-6xl">智慧边界</h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#625b50] dark:text-[#c3bbad] md:text-base">
                  奖项不是智慧的终点，而是一组被世界反复校验过的路标。这里从 15 个领域、33 项顶级奖项出发，认识那些改变知识、技术、制度与表达方式的人，以及他们真正解决的问题。
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-2 border-t border-[#cfc6b6] pt-5 dark:border-[#464139] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                {[[WISDOM_CATEGORIES.length, '领域'], [WISDOM_AWARDS.length, '奖项'], ['∞', '待扩充']].map(([value, label]) => (
                  <div key={label}>
                    <dd className="font-serif text-3xl font-semibold text-[#3a342b] dark:text-[#eee8dd]">{value}</dd>
                    <dt className="mt-1 text-[11px] text-[#847a69] dark:text-[#9f9688]">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <a href="#atlas" className="inline-flex items-center gap-2 rounded-full bg-[#29261f] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black dark:bg-[#eee8dd] dark:text-[#211f1b]">进入奖项图谱 <span>↓</span></a>
              <a href="#learning" className="inline-flex items-center gap-2 rounded-full border border-[#bdb3a2] bg-white/40 px-4 py-2.5 text-xs font-semibold text-[#5b5347] hover:border-[#8e806b] dark:border-[#514b42] dark:bg-white/5 dark:text-[#d5cec1]"><IconBook2 size={15} /> 学习路线</a>
              <a href="#comments" className="inline-flex items-center gap-2 rounded-full border border-[#bdb3a2] bg-white/40 px-4 py-2.5 text-xs font-semibold text-[#5b5347] hover:border-[#8e806b] dark:border-[#514b42] dark:bg-white/5 dark:text-[#d5cec1]"><IconMessageCircle size={15} /> 参与讨论</a>
            </div>
          </div>
        </header>

        <section id="people" className="mt-10 scroll-mt-24">
          <div className="flex items-end justify-between gap-5 border-b border-[var(--site-line)] pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">People & breakthroughs</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--site-ink)]">先认识八个智慧坐标</h2>
            </div>
            <span className="hidden text-xs text-[var(--site-faint)] md:block">从人出发，回到问题与方法</span>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-line)] sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((award, index) => (
              <article key={award.id} className="bg-[var(--site-paper)] p-4 dark:bg-[#171717]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryMap[award.category].color }} />
                </div>
                <h3 className="mt-5 text-sm font-semibold leading-6 text-[var(--site-ink)]">{award.representative}</h3>
                <p className="mt-1 text-[11px] text-[var(--site-faint)]">{award.title}</p>
                <p className="mt-3 line-clamp-4 text-xs leading-5 text-[var(--site-muted)]">{award.achievement}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="atlas" className="mt-12 scroll-mt-24">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Prize atlas</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--site-ink)]">全球顶级奖项图谱</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--site-muted)]">按领域筛选，或直接搜索奖项、人物与成就。展开卡片可查看代表坐标和官方入口。</p>
            </div>
            <label className="flex items-center gap-2 border-b border-[var(--site-line)] py-2 text-sm">
              <IconSearch size={17} className="shrink-0 text-[var(--site-faint)]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索奖项、人物或成就…" className="min-w-0 flex-1 bg-transparent text-[var(--site-ink)] outline-none placeholder:text-[var(--site-faint)]" />
              {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={15} className="text-[var(--site-faint)]" /></button> : null}
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="奖项领域筛选">
            <button type="button" onClick={() => setActiveCategory('all')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${activeCategory === 'all' ? 'border-[#29261f] bg-[#29261f] text-white dark:border-[#eee8dd] dark:bg-[#eee8dd] dark:text-[#211f1b]' : 'border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}>全部 {WISDOM_AWARDS.length}</button>
            {WISDOM_CATEGORIES.map((category) => (
              <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${activeCategory === category.id ? 'text-white' : 'border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`} style={activeCategory === category.id ? { backgroundColor: category.color, borderColor: category.color } : undefined}>{category.short}</button>
            ))}
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--site-faint)]">当前显示 {filtered.length} / {WISDOM_AWARDS.length} 项</p>

          {grouped.length ? (
            <div className="mt-7 space-y-5">
              {grouped.map(({ category, awards }) => (
                <section key={category.id} className="grid gap-5 rounded-2xl border border-[var(--site-line)] p-5 md:grid-cols-[210px_minmax(0,1fr)] md:p-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-3xl font-semibold" style={{ color: category.color }}>{category.index}</span>
                      <span className="rounded-full border border-[var(--site-line)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--site-faint)]">{awards.length} awards</span>
                    </div>
                    <h2 className="mt-3 text-base font-semibold leading-6 text-[var(--site-ink)]">{category.name}</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--site-muted)]">{category.intro}</p>
                  </div>
                  <div><div className="border-t border-[var(--site-line)] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">{awards.map((award) => <AwardCard key={award.id} award={award} category={category} />)}</div></div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[var(--site-line)] px-5 py-14 text-center">
              <p className="text-sm text-[var(--site-muted)]">没有找到匹配内容。</p>
              <button type="button" onClick={clearFilters} className="mt-3 text-xs font-semibold text-[var(--site-accent)]">清空筛选</button>
            </div>
          )}
        </section>

        <section id="learning" className="mt-12 scroll-mt-24 border-t border-[var(--site-line)] pt-8">
          <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#315b6b]/10 text-[#315b6b] dark:text-[#8eb8c7]"><IconBook2 size={19} /></span>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-[var(--site-ink)]">不是看榜单，是学习</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">把每个奖项当成一扇门：先建立地图，再进入人物、论文、作品和历史语境。</p>
            </div>
            <div className="divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
              {WISDOM_LEARNING_PATHS.map((item, index) => (
                <article key={item.level} className="grid gap-3 py-5 md:grid-cols-[54px_1fr_auto] md:items-center">
                  <span className="font-serif text-2xl text-[var(--site-faint)]">0{index + 1}</span>
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[var(--site-ink)]">{item.title}</h3><span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-[var(--site-faint)] dark:bg-white/5">{item.level} · {item.time}</span></div><p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">{item.description}</p></div>
                  <a href={item.href} className="text-xs font-semibold text-[var(--site-accent)]">{item.action} →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tracking" className="mt-12 scroll-mt-24 rounded-2xl bg-[#222722] px-5 py-7 text-[#eef1e8] dark:bg-[#e8e5dc] dark:text-[#24241f] md:px-8 md:py-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#b8c7b1] dark:text-[#687065]"><IconRadar size={16} /> Living archive</div>
              <h2 className="mt-3 font-serif text-2xl font-semibold">这是一份会继续生长的档案</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c9cec3] dark:text-[#5c6057]">首版先覆盖奖项全景和代表坐标，下一步逐项补充历届得主、原始论文 / 作品、中文学习材料、争议与后续影响。</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {WISDOM_TRACKING.map((item) => <article key={item.cadence} className="border-t border-white/20 pt-3 dark:border-black/15"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#aab9a4] dark:text-[#73796f]">{item.cadence}</span><h3 className="mt-2 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-[#bfc6ba] dark:text-[#666b62]">{item.description}</p></article>)}
              </div>
            </div>
            <aside className="border-l border-white/15 pl-5 dark:border-black/15">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#aab9a4] dark:text-[#73796f]">Last updated</p>
              <p className="mt-2 font-serif text-2xl font-semibold">{WISDOM_FRONTIER_UPDATED_AT}</p>
              <p className="mt-5 text-xs leading-5 text-[#bfc6ba] dark:text-[#666b62]">发现遗漏、事实错误，或想推荐值得展开的人物？欢迎直接在页面下方留下线索。</p>
              <a href="#comments" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#252820] dark:bg-[#292923] dark:text-white"><IconMessageCircle size={15} /> 参与共建</a>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/community" className="group rounded-2xl border border-[var(--site-line)] p-5 no-underline hover:no-underline"><IconMessageCircle size={20} className="text-[var(--site-accent)]" /><h2 className="mt-4 text-base font-semibold text-[var(--site-ink)]">讨论：什么才算人类智慧的边界？</h2><p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">进入讨论中心查看全站评论动态，或在本页留下问题、补充与不同意见。</p><span className="mt-4 inline-block text-xs font-semibold text-[var(--site-accent)]">进入讨论中心 <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span></Link>
          <Link href="/articles?tab=resources" className="group rounded-2xl border border-[var(--site-line)] p-5 no-underline hover:no-underline"><IconTrophy size={20} className="text-[#9b7435]" /><h2 className="mt-4 text-base font-semibold text-[var(--site-ink)]">继续探索站内资源</h2><p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">从 AI 学习、人文思想、书目索引到外部资料，沿着兴趣建立自己的长期知识地图。</p><span className="mt-4 inline-block text-xs font-semibold text-[var(--site-accent)]">返回资源库 <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span></Link>
        </section>
      </PageContainer>
    </>
  )
}
