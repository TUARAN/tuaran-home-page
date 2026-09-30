'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  IconArrowDown, IconArrowRight, IconArrowUpRight, IconBolt, IconBox, IconBraces,
  IconChartDots3, IconCheck, IconChevronDown, IconClipboardText, IconDownload,
  IconFileText, IconFilter, IconLayoutGrid, IconPalette, IconSearch, IconSparkles,
  IconWand, IconWriting, IconX,
} from '@tabler/icons-react'

import styles from './skill-center.module.css'

const ART = [
  { bg: '#a9cae9', ink: '#273640', Icon: IconBraces },
  { bg: '#c7c1e3', ink: '#343046', Icon: IconWand },
  { bg: '#8d9b68', ink: '#202719', Icon: IconChartDots3 },
  { bg: '#e27351', ink: '#3c211c', Icon: IconDownload },
  { bg: '#78a9c9', ink: '#172935', Icon: IconLayoutGrid },
  { bg: '#eacacb', ink: '#3d2528', Icon: IconWriting },
  { bg: '#bed7d0', ink: '#243832', Icon: IconFilter },
  { bg: '#df674c', ink: '#3d1d18', Icon: IconFileText },
]

const HERO_LOGO_ROWS = [
  Array.from({ length: 15 }, (_, index) => index + 1),
  Array.from({ length: 14 }, (_, index) => index + 16),
]

const AGENTS = [
  { name: 'Claude Code', src: '/images/skill-center/agents/claude-code.svg' },
  { name: 'Codex', src: '/images/skill-center/agents/codex.svg' },
  { name: 'Cursor', src: '/images/skill-center/agents/cursor.svg' },
  { name: 'Hermes Agent', src: '/images/skill-center/agents/hermes.svg' },
  { name: 'Grok', src: '/images/skill-center/agents/grok.svg' },
  { name: 'OpenCode', src: '/images/skill-center/agents/opencode.svg' },
  { name: 'OpenClaw', src: '/images/skill-center/agents/openclaw.svg' },
]

const FILTER_GROUPS = [
  { title: '推荐', items: [
    { key: 'installable', label: '可安装', matches: (skill) => skill.installable },
    { key: 'featured', label: '精选', matches: (_, index) => index < 4 },
  ] },
  { title: '按输出类型', items: [
    { key: '创作与分发', label: '创作与分发', matches: (skill) => skill.category === '创作与分发' },
    { key: '个人系统', label: '个人系统', matches: (skill) => skill.category === '个人系统' },
    { key: '研究与分析', label: '研究与分析', matches: (skill) => skill.category === '研究与分析' },
  ] },
  { title: '按角色', items: [
    { key: 'creator', label: '内容创作者', matches: (skill) => skill.category === '创作与分发' },
    { key: 'builder', label: '开发者', matches: (skill) => skill.category === '个人系统' },
    { key: 'researcher', label: '研究者', matches: (skill) => skill.category === '研究与分析' },
  ] },
  { title: '按使用场景', items: [
    { key: 'publishing', label: '内容发布', matches: (skill) => skill.category === '创作与分发' },
    { key: 'workflow', label: '工作流提效', matches: (skill) => skill.category === '个人系统' },
    { key: 'research', label: '深度研究', matches: (skill) => skill.category === '研究与分析' },
  ] },
]

function ArtTile({ skill, index, compact = false }) {
  const art = ART[index % ART.length]
  const Icon = art.Icon
  return (
    <div className={`${styles.artTile} ${compact ? styles.artTileCompact : ''}`} style={{ '--art-bg': art.bg, '--art-ink': art.ink }} aria-hidden="true">
      <span className={styles.artDot} />
      <Icon stroke={1.45} />
      <span className={styles.artLine} />
      <small>{skill.outputCount}</small>
    </div>
  )
}

function SkillCard({ skill, index }) {
  return (
    <article className={styles.skillCard}>
      <Link href={`/skill-center/${skill.id}`} className={styles.cardArtLink} aria-label={`查看 ${skill.title}`}>
        <ArtTile skill={skill} index={index} />
      </Link>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}><span>{skill.category}</span><b>{skill.installable ? '可安装' : '说明'}</b></div>
        <Link href={`/skill-center/${skill.id}`} className={styles.cardTitle}>{skill.title}</Link>
        <p>{skill.desc}</p>
        <div className={styles.cardFooter}>
          <span><IconBox size={14} /> {skill.name}</span>
          <Link href={`/skill-center/${skill.id}`} aria-label={`打开 ${skill.title}`}><IconArrowUpRight size={17} /></Link>
        </div>
      </div>
    </article>
  )
}

function TileMarquee({ logoNumbers, reverse = false }) {
  return (
    <div className={styles.tileRail} aria-hidden="true">
      <div className={`${styles.tileTrack} ${reverse ? styles.tileTrackReverse : ''}`}>
        {[0, 1].map((copy) => (
          <div className={styles.tileGroup} key={copy}>
            {logoNumbers.map((number) => (
              <div className={styles.heroSkillLogo} key={`${copy}-${number}`}>
                <Image
                  src={`/images/skill-center/hero-skill-logos/skill-logo-${String(number).padStart(2, '0')}.webp`}
                  alt=""
                  width={420}
                  height={420}
                  priority={copy === 0 && (number <= 6 || (number >= 16 && number <= 17))}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentStack() {
  return (
    <div className={styles.agentStack}>
      {AGENTS.map((agent) => (
        <span key={agent.name} title={agent.name}>
          <Image src={agent.src} alt={agent.name} width={27} height={27} />
        </span>
      ))}
      <span className={styles.moreAgents}>+6</span>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, onShowAll }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </div>
      <button type="button" onClick={onShowAll}>查看全部 <IconArrowRight size={16} /></button>
    </div>
  )
}

export default function SkillCenterExperience({ skills }) {
  const categories = useMemo(() => ['全部', ...new Set(skills.map((skill) => skill.category))], [skills])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [catalogView, setCatalogView] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])
  const filterItems = useMemo(() => FILTER_GROUPS.flatMap((group) => group.items), [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return skills.filter((skill) => {
      const matchesCategory = category === '全部' || skill.category === category
      const matchesFilters = activeFilters.every((key) => filterItems.find((item) => item.key === key)?.matches(skill, skills.indexOf(skill)))
      const haystack = `${skill.title} ${skill.name} ${skill.desc} ${skill.category}`.toLowerCase()
      return matchesCategory && matchesFilters && (!needle || haystack.includes(needle))
    })
  }, [activeFilters, category, filterItems, query, skills])

  const featured = skills.slice(0, 4)
  const installable = skills.filter((skill) => skill.installable).slice(0, 4)

  function revealCatalog(nextCategory = '全部') {
    setCategory(nextCategory)
    setCatalogView(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleFilter(key) {
    setCategory('全部')
    setActiveFilters((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  return (
    <main className={styles.page}>
      <div className={styles.promoBar}>
        <span><IconSparkles size={14} /> Skill Center</span>
        <p>把成熟方法装进你的智能体，重复使用，持续迭代。</p>
        <a href="#connect">安装指南 <IconArrowRight size={15} /></a>
      </div>

      <nav className={styles.marketNav} aria-label="Skill 中心导航">
        <Link href="/skill-center" className={styles.brand}><span><IconBolt size={18} /></span> Skill Center</Link>
        <div className={styles.navLinks}>
          <button type="button" onClick={() => revealCatalog()}>Skills</button>
          <button type="button" onClick={() => revealCatalog()}>分类 <IconChevronDown size={14} /></button>
          <a href="#connect">如何安装</a>
        </div>
        <label className={styles.topSearch}>
          <span className="sr-only">搜索 Skill</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setCatalogView(true) }} placeholder="想让智能体完成什么？" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={17} /></button> : <IconSearch size={18} />}
        </label>
        <a href="#connect" className={styles.installButton}>安装 Skill</a>
      </nav>

      {catalogView ? (
        <section className={styles.directoryView}>
          <aside className={styles.filterSidebar}>
            <div className={styles.filterTitle}>
              <strong>筛选</strong>
              <button type="button" onClick={() => setCatalogView(false)} aria-label="收起筛选"><IconArrowRight size={17} /></button>
            </div>
            {FILTER_GROUPS.map((group) => (
              <div className={styles.filterGroup} key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((item) => {
                  const count = skills.filter(item.matches).length
                  const checked = activeFilters.includes(item.key)
                  return (
                    <button type="button" key={item.key} className={checked ? styles.filterActive : ''} onClick={() => toggleFilter(item.key)} aria-pressed={checked}>
                      <span className={styles.filterCheck}>{checked ? <IconCheck size={14} /> : null}</span>
                      <span>{item.label}</span>
                      <small>{count}</small>
                    </button>
                  )
                })}
              </div>
            ))}
          </aside>
          <div className={styles.directoryResults}>
            <div className={styles.directoryHeading}>
              <p><strong>{filtered.length}</strong> 个 Skills</p>
              {(activeFilters.length || query) ? <button type="button" onClick={() => { setActiveFilters([]); setQuery(''); setCategory('全部') }}>清除筛选</button> : null}
            </div>
            {filtered.length ? (
              <div className={styles.directoryGrid}>
                {filtered.map((skill, index) => <SkillCard key={skill.id} skill={skill} index={index} />)}
              </div>
            ) : (
              <div className={styles.emptyState}><IconSearch size={30} /><strong>没有匹配的 Skill</strong><span>换个关键词或筛选条件试试。</span></div>
            )}
          </div>
        </section>
      ) : <>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <p className={styles.heroEyebrow}><span /> CURATED AGENT SKILLS <span /></p>
        <h1>让智能体拥有<br className={styles.mobileBreak} />真正好用的技能</h1>
        <TileMarquee logoNumbers={HERO_LOGO_ROWS[0]} />
        <div className={styles.tileRailSecond}><TileMarquee logoNumbers={HERO_LOGO_ROWS[1]} reverse /></div>
        <div className={styles.heroActions}>
          <button type="button" onClick={() => revealCatalog()}>浏览 Skills <IconArrowDown size={17} /></button>
          <a href="#connect"><IconSparkles size={17} /> 给智能体装上能力</a>
        </div>
        <div className={styles.worksWith}>
          <p>支持的 AGENT</p>
          <AgentStack />
        </div>
      </section>

      <section className={styles.contentSection}>
        <SectionHeading eyebrow="EDITOR'S PICK" title="精选 Agent Skills" onShowAll={() => revealCatalog()} />
        <div className={styles.featuredGrid}>{featured.map((skill, index) => <SkillCard key={skill.id} skill={skill} index={index} />)}</div>
      </section>

      <section className={`${styles.contentSection} ${styles.softSection}`}>
        <SectionHeading eyebrow="START HERE" title="可直接安装的 Skills" description="选择一个，查看完整说明与文件。无需订阅，也没有试用倒计时。" onShowAll={() => revealCatalog()} />
        <div className={styles.cardGrid}>{installable.map((skill, index) => <SkillCard key={skill.id} skill={skill} index={index + 4} />)}</div>
      </section>

      <section className={styles.contentSection}>
        <SectionHeading eyebrow="EXPLORE BY WORK" title="按任务发现能力" onShowAll={() => revealCatalog()} />
        <div className={styles.categoryGrid}>
          {categories.slice(1).map((item, index) => {
            const count = skills.filter((skill) => skill.category === item).length
            const Icon = [IconWriting, IconBraces, IconChartDots3, IconClipboardText][index % 4]
            return (
              <button type="button" key={item} onClick={() => revealCatalog(item)}>
                <span><Icon size={25} stroke={1.5} /></span><strong>{item}</strong><small>{count} 项 Skills</small><IconArrowUpRight className={styles.categoryArrow} size={19} />
              </button>
            )
          })}
        </div>
      </section>

      <section id="skill-catalog" className={`${styles.contentSection} ${styles.catalog}`}>
        <div className={styles.catalogTop}>
          <div><p>ALL SKILLS</p><h2>完整 Skill 目录</h2></div>
          <label className={styles.catalogSearch}>
            <IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、用途或分类" />
            {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={16} /></button> : null}
          </label>
        </div>
        <div className={styles.pills}>
          {categories.map((item) => <button type="button" key={item} className={category === item ? styles.activePill : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        {filtered.length ? <div className={styles.catalogGrid}>{filtered.map((skill, index) => <SkillCard key={skill.id} skill={skill} index={index + 1} />)}</div> : (
          <div className={styles.emptyState}><IconSearch size={30} /><strong>没有匹配的 Skill</strong><span>换个关键词或分类试试。</span></div>
        )}
      </section>

      <section id="connect" className={styles.connectSection}>
        <div className={styles.connectIntro}>
          <p>AGENT-FIRST INSTALLATION</p><h2>连接你的智能体</h2><span>让 AI 在真实任务中调用经过整理、可以复用的工作流。</span>
          <Link href={`/skill-center/${skills[0]?.id || ''}`}>打开一个 Skill <IconArrowRight size={17} /></Link>
        </div>
        <div className={styles.installCard}>
          <div className={styles.installCardHead}><span><IconSparkles size={19} /></span><div><strong>把链接交给智能体</strong><small>推荐方式</small></div></div>
          <blockquote>“打开这个 Skill 页面，阅读说明并帮我安装，然后验证它可以正常使用。”</blockquote>
          <ol>
            <li><span>01</span> 选择一项 Skill <IconCheck size={16} /></li>
            <li><span>02</span> 下载或复制文件 <IconCheck size={16} /></li>
            <li><span>03</span> 安装并验证 <IconCheck size={16} /></li>
          </ol>
        </div>
      </section>

      <section className={styles.finalCta}>
        <IconPalette size={30} stroke={1.4} /><h2>准备好扩展你的智能体了吗？</h2><p>挑选一个真实任务，从一项 Skill 开始。</p>
        <button type="button" onClick={() => revealCatalog()}>浏览全部 Skills <IconArrowRight size={17} /></button>
      </section>
      </>}
    </main>
  )
}
