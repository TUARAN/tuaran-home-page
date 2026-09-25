'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowDown,
  IconArrowUpRight,
  IconBook2,
  IconExternalLink,
  IconFilter,
  IconInfoCircle,
  IconSearch,
  IconX,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import { CAUTIONS, DYNASTIES, PEOPLE, RESOURCES, STEPS, TEXTS } from './data'
import styles from './zhuangyuan.module.css'

const SHARE_URL = 'https://2aran.com/zhuangyuan'
const SECTION_LINKS = [
  { id: 'system', label: '怎么中状元' },
  { id: 'dynasties', label: '各朝口径' },
  { id: 'archive', label: '人物档案' },
  { id: 'texts', label: '原文释义' },
  { id: 'resources', label: '相关资源' },
]

const TONE = Object.fromEntries(CAUTIONS.map((item) => [item.level, item.tone]))

function dynastyOf(id) {
  return DYNASTIES.find((item) => item.id === id)
}

function PersonDossier({ person, texts }) {
  const meta = dynastyOf(person.dynasty)
  const tone = TONE[person.caution.level] || 'amber'
  return (
    <article className={styles.dossierBody}>
      <header className={styles.dossierHead}>
        <Mark person={person} />
        <div>
          <p style={{ color: meta.color }}>{meta.label} · {person.exam} · {person.year}</p>
          <h3>{person.name}</h3>
          <p>{person.place} · {person.headline}</p>
        </div>
      </header>
      {person.image ? (
        <div className={styles.dossierFigure}>
          <Image src={person.image} alt={person.imageAlt} fill sizes="(max-width: 800px) 100vw, 720px" className={styles.portraitImage} />
          {person.imageCredit ? <a href={person.imageCredit} target="_blank" rel="noreferrer">图像文件页 <IconExternalLink size={13} /></a> : null}
        </div>
      ) : null}
      <p className={styles.dossierSummary}>{person.summary}</p>
      <dl className={styles.dossierFacts}>
        <div><dt>中式之后</dt><dd>{person.after}</dd></div>
        <div><dt>可核对</dt><dd>{person.fact}</dd></div>
      </dl>
      <div className={`${styles.caution} ${styles[`tone${tone}`]}`}>
        <span>{person.caution.level}</span>
        <strong>{person.caution.title}</strong>
        <p>{person.caution.text}</p>
      </div>
      <a className={styles.dossierLink} href={person.source} target="_blank" rel="noreferrer">{person.sourceLabel} <IconArrowUpRight size={14} /></a>
      {texts.map((item) => (
        <section key={item.id} className={styles.dossierText}>
          <p className={styles.textMeta}>{item.kind} · {item.meta}</p>
          <h4>{item.title}</h4>
          {item.original.split('\n').map((line) => <p key={line} className={styles.original}>{line}</p>)}
          <h4>释义</h4>
          <p className={styles.gloss}>{item.gloss}</p>
          <div className={styles.note}><IconInfoCircle size={18} /><p>{item.note}</p></div>
          <a href={item.href} target="_blank" rel="noreferrer">{item.hrefLabel} <IconExternalLink size={14} /></a>
        </section>
      ))}
    </article>
  )
}

function Mark({ person }) {
  if (person.image) {
    return (
      <div className={styles.portrait}>
        <Image src={person.image} alt={person.imageAlt} fill sizes="72px" className={styles.portraitImage} />
      </div>
    )
  }
  return (
    <div className={styles.seal} aria-hidden="true">
      <span>{person.name.slice(0, 1)}</span>
    </div>
  )
}

export default function ZhuangyuanClient() {
  const [dynasty, setDynasty] = useState('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState('wen-tianxiang')
  const [textId, setTextId] = useState(TEXTS[0].id)
  const [activeSection, setActiveSection] = useState('system')

  useEffect(() => {
    let frame = 0
    function updateActiveSection() {
      frame = 0
      const line = Math.min(window.innerHeight * 0.32, 240)
      let current = SECTION_LINKS[0].id
      SECTION_LINKS.forEach(({ id }) => {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= line) current = id
      })
      setActiveSection(current)
    }
    function queue() {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection)
    }
    updateActiveSection()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
    }
  }, [])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return PEOPLE.filter((person) => {
      if (dynasty !== 'all' && person.dynasty !== dynasty) return false
      if (!normalized) return true
      const text = `${person.name}${person.place}${person.exam}${person.headline}${person.keywords.join('')}${person.caution.level}`.toLowerCase()
      return text.includes(normalized)
    })
  }, [dynasty, query])

  const activeText = TEXTS.find((item) => item.id === textId) || TEXTS[0]
  const portraits = PEOPLE.filter((person) => person.image)
  const selected = visible.find((person) => person.id === activeId) || visible[0] || null
  const selectedTexts = selected ? TEXTS.filter((item) => item.personId === selected.id) : []
  const directory = DYNASTIES
    .map((item) => ({ ...item, people: visible.filter((person) => person.dynasty === item.id) }))
    .filter((item) => item.people.length)

  function openPerson(id) {
    setActiveId(id)
    const match = TEXTS.find((item) => item.personId === id)
    if (match) setTextId(match.id)
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroUtility}>
            <span>科举 · 殿试第一 · 622—1904</span>
            <SharePageButton title="中国历代状元" text="科年、原文、释义和可以继续核对的名录。" url={SHARE_URL} size="sm" />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Original texts · Gloss · Portraits</p>
            <h1><span>历代</span>状元</h1>
            <p>乡试、会试、殿试走到最后一甲第一。这一页收科年、中式之后的去向、殿试原文和后出作品，并标明哪些名次仍有争议。</p>
            <a href="#archive" className={styles.heroCta}>从档案看起 <IconArrowDown size={16} /></a>
          </div>
          <div className={styles.heroStats}>
            <div><strong>16</strong><span>份精选档案</span></div>
            <div><strong>89</strong><span>明殿试科次</span></div>
            <div><strong>114</strong><span>清状元人数</span></div>
            <div><strong>1904</strong><span>最后一科</span></div>
          </div>
          <div className={styles.heroPortraits}>
            {portraits.map((person) => (
              <a key={person.id} href="#archive" className={styles.heroPortrait} onClick={() => openPerson(person.id)}>
                <Image src={person.image} alt={person.imageAlt} fill sizes="120px" className={styles.portraitImage} />
                <span>{person.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <nav className={styles.sectionNav} aria-label="页面章节">
        {SECTION_LINKS.map(({ id, label }) => {
          const active = activeSection === id
          return (
            <a key={id} href={`#${id}`} className={`${styles.sectionNavLink} ${active ? styles.sectionNavLinkActive : ''}`} aria-current={active ? 'location' : undefined} onClick={() => setActiveSection(id)}>
              {label}
            </a>
          )
        })}
      </nav>

      <section id="system" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>01 / EXAM</span><h2>状元只指出自殿试的第一名</h2></div>
          <p>解元、会元、状元各是一场考试的第一名。三次都是第一，才叫连中三元。明清状元的起家官是翰林院修撰，从六品。</p>
        </div>
        <div className={styles.stepGrid}>
          {STEPS.map((step, index) => (
            <article key={step.name} className={styles.stepCard}>
              <div><span>{String(index + 1).padStart(2, '0')}</span><small>{step.first}</small></div>
              <h3>{step.name}</h3>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="dynasties" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>02 / SCOPE</span><h2>先看每一朝能数到哪一步</h2></div>
          <p>唐、宋、明、清的“状元人数”不是同一套账。页面用通行口径，并写出不能直接相加的原因。</p>
        </div>
        <div className={styles.dynastyGrid}>
          {DYNASTIES.map((item) => (
            <article key={item.id} className={styles.dynastyCard}>
              <div><i style={{ background: item.color }} /><span>{item.range}</span></div>
              <h3>{item.label}</h3>
              <strong>{item.count}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="archive" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>03 / ARCHIVE</span><h2>十六份能回到出处的档案</h2></div>
          <p>这不是全名单。选入的人要么本传写明名次，要么争议已经被标明。搜索可以试“三元”“末科”“除名”。</p>
        </div>
        <div className={styles.reader}>
          <aside className={styles.toc} aria-label="状元目录">
            <label className={styles.searchBox}>
              <IconSearch size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜人名、籍贯、科年…" />
              {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={15} /></button> : null}
            </label>
            <div className={styles.phaseFilters}>
              <span><IconFilter size={14} /> 朝代</span>
              <button type="button" className={dynasty === 'all' ? styles.filterActive : ''} onClick={() => setDynasty('all')}>全部</button>
              {DYNASTIES.map((item) => (
                <button type="button" key={item.id} className={dynasty === item.id ? styles.filterActive : ''} onClick={() => setDynasty(item.id)}>{item.label}</button>
              ))}
            </div>
            <p className={styles.resultNote}>{visible.length} 人</p>
            <div className={styles.tocList}>
              {directory.map((group) => (
                <div key={group.id}>
                  <h3 style={{ color: group.color }}>{group.label}</h3>
                  {group.people.map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      id={`person-${person.id}`}
                      className={selected?.id === person.id ? styles.tocItemActive : styles.tocItem}
                      aria-current={selected?.id === person.id ? 'true' : undefined}
                      onClick={() => openPerson(person.id)}
                    >
                      <small>{person.year}</small>
                      <strong>{person.name}</strong>
                      <span>{person.place}</span>
                    </button>
                  ))}
                </div>
              ))}
              {!visible.length ? <div className={styles.empty}>没有匹配的人。试试“三元”或“末科”。</div> : null}
            </div>
          </aside>
          <div className={styles.dossier}>
            {selected ? <PersonDossier person={selected} texts={selectedTexts} /> : <div className={styles.empty}>从左边选一位状元。</div>}
          </div>
        </div>
      </section>

      <section id="texts" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>04 / TEXT</span><h2>原文和释义放在两栏</h2></div>
          <p>对策、后出词作、策问文体分开。省略处保留省略号，不把释义写回原文。</p>
        </div>
        <div className={styles.textSwitch}>
          {TEXTS.map((item) => (
            <button type="button" key={item.id} className={textId === item.id ? styles.filterActive : ''} onClick={() => setTextId(item.id)}>
              <small>{item.kind}</small>
              {item.title}
            </button>
          ))}
        </div>
        <article className={styles.textLayout}>
          <div>
            <p className={styles.textMeta}>{activeText.meta}</p>
            <h3>原文</h3>
            {activeText.original.split('\n').map((line) => <p key={line} className={styles.original}>{line}</p>)}
          </div>
          <div>
            <h3>释义</h3>
            <p className={styles.gloss}>{activeText.gloss}</p>
            <div className={styles.note}><IconInfoCircle size={18} /><p>{activeText.note}</p></div>
            <a href={activeText.href} target="_blank" rel="noreferrer">{activeText.hrefLabel} <IconExternalLink size={14} /></a>
          </div>
        </article>
        <div className={styles.essay}>
          <div className={styles.essayVisual}>
            <Image src="/images/zhuangyuan/wentianxiang.jpg" alt="文天祥线描立像" fill sizes="(max-width: 800px) 100vw, 360px" className={styles.essayImage} />
          </div>
          <div>
            <span>一份还能读到全卷的状元</span>
            <h2>文天祥的名次是改出来的。</h2>
            <p>详定官原拟第五，理宗改为第一。同榜第二甲里有谢枋得、陆秀夫。登科录把策题、考官和对策留在一起，所以这一科可以读到卷面，不必只靠后来的传记。</p>
            <a href="https://commons.wikimedia.org/wiki/File:Wen_Tianxiang.jpg" target="_blank" rel="noreferrer">线描像文件页 <IconExternalLink size={14} /></a>
          </div>
        </div>
      </section>

      <section id="resources" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span>05 / SOURCES</span><h2>继续核对的入口</h2></div>
          <p>人物小传里的判断属于编辑说明。科年、名次和引文以下面的原文、正史和名录为准。</p>
        </div>
        <div className={styles.sourceGrid}>
          {RESOURCES.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={styles.sourceCard}>
              <div><IconBook2 size={18} /><span>{item.kind}</span></div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
              <span>打开 <IconArrowUpRight size={14} /></span>
            </a>
          ))}
        </div>
        <div className={styles.scopeNote}>
          <IconInfoCircle size={20} />
          <p>范围只包括文科殿试第一。武状元、女科传说、太平天国和张献忠政权的榜次不在这一页。辽、金、元的左右榜需要单独做名录，这里只说明它们为什么不能并进 114 人。</p>
        </div>
      </section>
    </main>
  )
}
