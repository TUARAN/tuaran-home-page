'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowDown,
  IconArrowUpRight,
  IconBook2,
  IconCheck,
  IconCrown,
  IconExternalLink,
  IconFilter,
  IconInfoCircle,
  IconScale,
  IconSearch,
  IconSparkles,
  IconSwords,
  IconTimeline,
  IconX,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import { COMPARISON_ROWS, EMPERORS, EVENTS, PHASES, SCORE_LABELS, SOURCES } from './data'
import styles from './ming-emperors.module.css'

const SHARE_URL = 'https://2aran.com/ming-emperors'
const DEFAULT_COMPARE = ['hongwu', 'yongle', 'wanli', 'chongzhen']
const MAX_COMPARE = 4
const SECTION_LINKS = [
  { id: 'timeline', label: '朝代脉搏' },
  { id: 'emperors', label: '十六帝档案' },
  { id: 'compare', label: '横向对比' },
  { id: 'legends', label: '史实与传闻' },
  { id: 'sources', label: '资料来源' },
]

const LEGEND_TONES = {
  '有据争议': 'amber',
  '未证传闻': 'red',
  '后世推测': 'amber',
  '标签失真': 'blue',
  '叙事争议': 'blue',
  '叙事夸张': 'red',
  '流行说法': 'amber',
  '概念误读': 'blue',
  '证据不足': 'red',
  '重大争议': 'red',
  '责任争论': 'amber',
  '标签夸张': 'blue',
}

function EmperorMark({ emperor, compact = false }) {
  if (emperor.image) {
    return (
      <div className={`${styles.portrait} ${compact ? styles.portraitCompact : ''}`}>
        <Image
          src={emperor.image}
          alt={`${emperor.temple}${emperor.era}帝${emperor.name}传世画像`}
          fill
          sizes={compact ? '64px' : '(max-width: 768px) 40vw, 220px'}
          style={{ objectPosition: emperor.imagePosition }}
          className={styles.portraitImage}
        />
      </div>
    )
  }

  return (
    <div className={`${styles.seal} ${compact ? styles.sealCompact : ''}`} aria-hidden="true">
      <span>{emperor.era.slice(0, 1)}</span>
      <small>{String(emperor.order).padStart(2, '0')}</small>
    </div>
  )
}

function ScoreBars({ scores }) {
  return (
    <div className={styles.scoreGrid}>
      {Object.entries(SCORE_LABELS).map(([key, label]) => (
        <div key={key} className={styles.scoreRow}>
          <span>{label}</span>
          <div className={styles.scoreTrack} aria-label={`${label} ${scores[key]} / 5`}>
            <i style={{ width: `${scores[key] * 20}%` }} />
          </div>
          <b>{scores[key]}</b>
        </div>
      ))}
    </div>
  )
}

function EmperorDossier({ emperor, selected, onCompare }) {
  const phase = PHASES.find((item) => item.id === emperor.phase)
  const years = emperor.years < 1 ? emperor.reign.match(/（(.+)）/)?.[1] || '不足一年' : `${emperor.years} 年`
  return (
    <article className={styles.dossierBody}>
      <header className={styles.dossierHead}>
        <EmperorMark emperor={emperor} />
        <div>
          <p style={{ color: phase.color }}>{String(emperor.order).padStart(2, '0')} · {phase.label}</p>
          <h3>{emperor.era}<small>帝</small></h3>
          <p>{emperor.temple} · {emperor.name}</p>
          <p>{emperor.reign} · {years}</p>
        </div>
      </header>
      <p className={styles.cardHeadline}>{emperor.headline}</p>
      <p className={styles.detailSummary}>{emperor.summary}</p>
      <ScoreBars scores={emperor.scores} />
      <dl className={styles.proConGrid}>
        <div><dt>留下什么</dt><dd>{emperor.achievement}</dd></div>
        <div><dt>付出什么</dt><dd>{emperor.cost}</dd></div>
      </dl>
      <div className={styles.factBox}>
        <IconCheck size={17} />
        <div><strong>可核对事实</strong><p>{emperor.fact}</p></div>
      </div>
      <div className={`${styles.legendBox} ${styles[`legend${LEGEND_TONES[emperor.legend.level] || 'amber'}`]}`}>
        <IconSparkles size={17} />
        <div>
          <span>{emperor.legend.level}</span>
          <strong>{emperor.legend.title}</strong>
          <p>{emperor.legend.text}</p>
        </div>
      </div>
      <div className={styles.detailActions}>
        <button type="button" onClick={() => onCompare(emperor.id)}>
          {selected ? <><IconX size={15} />移出对比</> : <><IconScale size={15} />加入对比</>}
        </button>
        <a href={emperor.source} target="_blank" rel="noreferrer">读《明史》本纪 <IconArrowUpRight size={14} /></a>
      </div>
    </article>
  )
}

export default function MingEmperorsClient() {
  const [phase, setPhase] = useState('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState('hongwu')
  const [compareIds, setCompareIds] = useState(DEFAULT_COMPARE)
  const [activeSection, setActiveSection] = useState('timeline')

  useEffect(() => {
    function resetPageHorizontalOffset() {
      document.documentElement.scrollLeft = 0
      document.body.scrollLeft = 0
    }

    resetPageHorizontalOffset()
    window.addEventListener('pageshow', resetPageHorizontalOffset)
    window.addEventListener('resize', resetPageHorizontalOffset)
    return () => {
      window.removeEventListener('pageshow', resetPageHorizontalOffset)
      window.removeEventListener('resize', resetPageHorizontalOffset)
    }
  }, [])

  useEffect(() => {
    let frame = 0

    function updateActiveSection() {
      frame = 0
      const activationLine = Math.min(window.innerHeight * 0.32, 240)
      let current = SECTION_LINKS[0].id

      SECTION_LINKS.forEach(({ id }) => {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= activationLine) current = id
      })

      setActiveSection(current)
    }

    function queueUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection)
    }

    updateActiveSection()
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', queueUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
    }
  }, [])

  const visibleEmperors = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return EMPERORS.filter((emperor) => {
      if (phase !== 'all' && emperor.phase !== phase) return false
      if (!normalized) return true
      const text = `${emperor.era}${emperor.temple}${emperor.name}${emperor.headline}${emperor.keywords.join('')}`.toLowerCase()
      return text.includes(normalized)
    })
  }, [phase, query])

  const compared = compareIds.map((id) => EMPERORS.find((item) => item.id === id)).filter(Boolean)
  const selected = visibleEmperors.find((emperor) => emperor.id === activeId) || visibleEmperors[0] || null
  const directory = PHASES
    .map((item) => ({ ...item, emperors: visibleEmperors.filter((emperor) => emperor.phase === item.id) }))
    .filter((item) => item.emperors.length)

  function toggleCompare(id) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_COMPARE) return [...current.slice(1), id]
      return [...current, id]
    })
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          src="/images/ming-emperors/palace.jpg"
          alt="《北京宫城图轴》所绘宫城建筑"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroWash} />
        <div className={styles.heroInner}>
          <div className={styles.heroUtility}>
            <span><IconCrown size={15} /> 大明 · 1368—1644</span>
            <SharePageButton title="明朝十六帝" text="一条时间线，看完明朝十六帝的权力、功业与争议。" url={SHARE_URL} size="sm" />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Sixteen reigns · One political system</p>
            <h1><span>明朝</span>十六帝</h1>
            <p>从布衣天子到煤山绝笔。把 276 年皇权放在同一条轴上，看继承、战争、财政、内阁、宦官与个人性格如何互相放大。</p>
            <a href="#emperors" className={styles.heroCta}>开始阅帝 <IconArrowDown size={16} /></a>
          </div>
          <div className={styles.heroStats}>
            <div><strong>16</strong><span>位皇帝</span></div>
            <div><strong>17</strong><span>次登基</span></div>
            <div><strong>276</strong><span>年国祚</span></div>
            <div><strong>2</strong><span>座首都</span></div>
          </div>
          <a className={styles.imageCredit} href="https://commons.wikimedia.org/wiki/File:北京宫城图轴.jpg" target="_blank" rel="noreferrer">图：《北京宫城图轴》· 公共领域 <IconExternalLink size={12} /></a>
        </div>
      </section>

      <nav className={styles.sectionNav} aria-label="页面章节">
        {SECTION_LINKS.map(({ id, label }) => {
          const active = activeSection === id
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`${styles.sectionNavLink} ${active ? styles.sectionNavLinkActive : ''}`}
              aria-current={active ? 'location' : undefined}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </a>
          )
        })}
      </nav>

      <section id="timeline" className={`${styles.section} ${styles.timelineSection}`}>
        <div className={styles.sectionHeading}>
          <div><span>01 / TIMELINE</span><h2>先看权力如何交接</h2></div>
          <p>明朝 16 位皇帝，实际发生 17 次登基：朱祁镇在土木堡被俘，八年后又以“夺门之变”复位。</p>
        </div>

        <div className={styles.phaseLegend}>
          {PHASES.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}<small>{item.range}</small></span>)}
        </div>

        <div className={styles.reignScroller}>
          <div className={styles.reignRail} role="img" aria-label="明朝十六帝在位时间比例图">
            {EMPERORS.map((emperor, index) => {
              const left = ((emperor.start - 1368) / 276) * 100
              const rawWidth = ((emperor.end - emperor.start) / 276) * 100
              const width = Math.max(rawWidth, 0.7)
              const phaseMeta = PHASES.find((item) => item.id === emperor.phase)
              const lane = index % 3
              return (
                <button
                  type="button"
                  key={emperor.id}
                  onClick={() => { setActiveId(emperor.id); document.getElementById('emperors')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className={styles.reignBar}
                  style={{ left: `${left}%`, width: `${width}%`, top: `${18 + lane * 42}px`, background: phaseMeta.color }}
                  title={`${emperor.era}帝 ${emperor.reign}`}
                >
                  <span>{emperor.era}</span>
                </button>
              )
            })}
            {[1368, 1400, 1450, 1500, 1550, 1600, 1644].map((year) => (
              <span key={year} className={styles.yearTick} style={{ left: `${((year - 1368) / 276) * 100}%` }}>{year}</span>
            ))}
          </div>
        </div>

        <div className={styles.eventsGrid}>
          {EVENTS.map((event, index) => (
            <article key={`${event.year}-${event.title}`} className={styles.eventCard}>
              <div><span>{event.year}</span><i>{String(index + 1).padStart(2, '0')}</i></div>
              <small>{event.type}</small>
              <h3>{event.title}</h3>
              <p>{event.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="emperors" className={`${styles.section} ${styles.emperorSection}`}>
        <div className={styles.sectionHeading}>
          <div><span>02 / EMPERORS</span><h2>十六份皇权档案</h2></div>
          <p>评分是便于比较的编辑性刻度，不是历史学定论。左边点年号，右边看史实、代价和一则需要辨别的传闻。</p>
        </div>

        <div className={styles.reader}>
          <aside className={styles.toc} aria-label="皇帝目录">
            <label className={styles.searchBox}>
              <IconSearch size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜年号、人名、事件…" />
              {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={15} /></button> : null}
            </label>
            <div className={styles.phaseFilters} aria-label="按历史阶段筛选">
              <span><IconFilter size={14} /> 阶段</span>
              <button type="button" className={phase === 'all' ? styles.filterActive : ''} onClick={() => setPhase('all')}>全部</button>
              {PHASES.map((item) => <button type="button" key={item.id} className={phase === item.id ? styles.filterActive : ''} onClick={() => setPhase(item.id)}>{item.label}</button>)}
            </div>
            <p className={styles.resultNote}>{visibleEmperors.length} 位 · 已选 {compareIds.length} 位对比</p>
            <div className={styles.tocList}>
              {directory.map((group) => (
                <div key={group.id}>
                  <h3 style={{ color: group.color }}>{group.label}</h3>
                  {group.emperors.map((emperor) => (
                    <button
                      type="button"
                      key={emperor.id}
                      className={selected?.id === emperor.id ? styles.tocItemActive : styles.tocItem}
                      aria-current={selected?.id === emperor.id ? 'true' : undefined}
                      onClick={() => setActiveId(emperor.id)}
                    >
                      <small>{String(emperor.order).padStart(2, '0')}</small>
                      <strong>{emperor.era}</strong>
                      <span>{emperor.name}</span>
                    </button>
                  ))}
                </div>
              ))}
              {!visibleEmperors.length ? <div className={styles.emptyState}>没有匹配的皇帝。试试“土木堡”“海贸”或“万历”。</div> : null}
            </div>
          </aside>
          <div className={styles.dossier}>
            {selected ? (
              <EmperorDossier emperor={selected} selected={compareIds.includes(selected.id)} onCompare={toggleCompare} />
            ) : (
              <div className={styles.emptyState}>从左边选一位皇帝。</div>
            )}
          </div>
        </div>
      </section>

      <section id="compare" className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.sectionHeading}>
          <div><span>03 / COMPARE</span><h2>把四个人放在同一张桌上</h2></div>
          <p>最多选择四位；继续添加时会自动替换最早选择的一位。</p>
        </div>

        <div className={styles.comparePicker}>
          {EMPERORS.map((emperor) => {
            const selected = compareIds.includes(emperor.id)
            return <button type="button" key={emperor.id} onClick={() => toggleCompare(emperor.id)} className={selected ? styles.compareSelected : ''}>{emperor.era}{selected ? <IconCheck size={13} /> : null}</button>
          })}
        </div>

        {compared.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>维度</th>
                  {compared.map((emperor) => <th key={emperor.id}><span>{emperor.temple}</span><strong>{emperor.era}</strong><small>{emperor.name}</small></th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.key}>
                    <th>{row.label}</th>
                    {compared.map((emperor) => <td key={emperor.id}>{row.format ? row.format(emperor[row.key]) : emperor[row.key]}</td>)}
                  </tr>
                ))}
                {Object.entries(SCORE_LABELS).map(([key, label]) => (
                  <tr key={key}>
                    <th>{label}刻度</th>
                    {compared.map((emperor) => <td key={emperor.id}><div className={styles.tableScore}><i style={{ width: `${emperor.scores[key] * 20}%` }} /><span>{emperor.scores[key]} / 5</span></div></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className={styles.emptyState}>至少选择一位皇帝开始对比。</div>}
      </section>

      <section id="legends" className={`${styles.section} ${styles.legendSection}`}>
        <div className={styles.sectionHeading}>
          <div><span>04 / FACT OR FICTION</span><h2>野史好看，证据要分层</h2></div>
          <p>这里不把传闻删掉，而是标明它属于史料事实、可讨论推测，还是缺少证据的流行故事。</p>
        </div>

        <div className={styles.evidenceRule}>
          <IconInfoCircle size={19} />
          <div><strong>阅读规则</strong><p>“正史有载”不自动等于绝对真相；官修史书也有成书立场。较稳妥的判断需要同时看材料出现时间、作者位置、版本差异与考古证据。</p></div>
        </div>

        <div className={styles.legendGrid}>
          {EMPERORS.map((emperor) => (
            <article key={emperor.id} className={styles.legendCard}>
              <div className={styles.legendCardHead}>
                <span>{emperor.era}</span>
                <i className={styles[`pill${LEGEND_TONES[emperor.legend.level] || 'amber'}`]}>{emperor.legend.level}</i>
              </div>
              <h3>{emperor.legend.title}</h3>
              <p>{emperor.legend.text}</p>
              <a href={emperor.source} target="_blank" rel="noreferrer">对照本纪 <IconArrowUpRight size={13} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.imageEssay}>
        <div className={styles.imageEssayVisual}>
          <Image src="/images/ming-emperors/tianqi.jpg" alt="明熹宗天启帝传世画像" fill sizes="(max-width: 900px) 100vw, 44vw" className={styles.essayImage} />
        </div>
        <div className={styles.imageEssayCopy}>
          <span>一个王朝的误读样本</span>
          <h2>“木匠皇帝”四个字，解释不了天启七年。</h2>
          <p>个人爱好是真的，权力外包也是真的。更关键的问题是：皇帝为何把大量政务交给近侍？辽东军费、党争与官僚互不信任，又如何让魏忠贤的网络迅速扩大？</p>
          <p>理解帝王，不只看品德标签，还要看他接手了什么结构、掌握哪些工具、允许谁替他行动，以及错误如何被制度放大。</p>
          <a href="https://commons.wikimedia.org/wiki/File:熹宗悊皇帝.jpg" target="_blank" rel="noreferrer">查看画像档案与版权 <IconExternalLink size={14} /></a>
        </div>
      </section>

      <section id="sources" className={`${styles.section} ${styles.sourcesSection}`}>
        <div className={styles.sectionHeading}>
          <div><span>05 / SOURCES</span><h2>继续查证的六个入口</h2></div>
          <p>年代和基本事件以本纪、博物馆与遗产机构资料交叉整理；页面中的评分和阶段划分属于编辑性解释。</p>
        </div>
        <div className={styles.sourceGrid}>
          {SOURCES.map((source, index) => (
            <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className={styles.sourceCard}>
              <div><IconBook2 size={18} /><span>{source.kind}</span><i>{String(index + 1).padStart(2, '0')}</i></div>
              <h3>{source.title}</h3>
              <p>{source.note}</p>
              <span>打开资料 <IconArrowUpRight size={14} /></span>
            </a>
          ))}
        </div>
        <div className={styles.scopeNote}>
          <IconTimeline size={20} />
          <p><strong>范围说明：</strong>“明朝十六帝”按 1368—1644 年北京中央政权口径计算，不把南明诸帝计入十六帝。英宗两次即位仍按一人计算。</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><IconSwords size={19} /><span>大明十六帝 · 交互历史档案</span></div>
        <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>回到开头 ↑</a>
      </footer>
    </main>
  )
}
