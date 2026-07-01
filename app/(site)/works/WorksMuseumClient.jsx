'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import styles from './works-museum.module.css'

const TYPE_TONES = {
  product: { accent: '#9a3f2d', wash: '#d7b19f', deep: '#4b2119' },
  'ai-engineering': { accent: '#276b84', wash: '#a8c4cb', deep: '#173a48' },
  'content-system': { accent: '#3f6c50', wash: '#afc2ac', deep: '#253d2d' },
  'research-page': { accent: '#725292', wash: '#c3b1d1', deep: '#3d2a50' },
  'tool-experiment': { accent: '#a06a12', wash: '#d8c59c', deep: '#50370d' },
  'browser-extension': { accent: '#2f6f68', wash: '#a8cfc6', deep: '#173d39' },
  'quant-analysis': { accent: '#a83f36', wash: '#d5aaa6', deep: '#52211d' },
}

const STATUS_LABELS = {
  operating: '运营中',
  building: '打磨中',
  experiment: '实验展',
  shipped: '已上线',
  archived: '典藏',
}

function isExternal(href) {
  return /^https?:\/\//.test(href)
}

function numberLabel(index) {
  return String(index + 1).padStart(2, '0')
}

function ArrowIcon({ direction = 'right' }) {
  const rotate = direction === 'left' ? 'rotate(180deg)' : undefined
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ transform: rotate }}>
      <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MuseumPoster({ item, index = 0, compact = false }) {
  const tone = TYPE_TONES[item.type] || TYPE_TONES.product
  const initials = item.title
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${styles.poster} ${compact ? styles.posterCompact : ''}`}
      style={{ '--poster-accent': tone.accent, '--poster-wash': tone.wash, '--poster-deep': tone.deep }}
      aria-hidden="true"
    >
      <span className={styles.posterIndex}>EXHIBIT / {numberLabel(index)}</span>
      <span className={styles.posterMark}>{initials || 'W'}</span>
      <span className={styles.posterTitle}>{item.title}</span>
      <span className={styles.posterRule} />
      <span className={styles.posterCaption}>DIGITAL WORKS · 2ARAN ARCHIVE</span>
    </div>
  )
}

function WorkLink({ item, className, children }) {
  return (
    <a
      href={item.href}
      className={className}
      download={item.download ? '' : undefined}
      target={isExternal(item.href) ? '_blank' : undefined}
      rel={isExternal(item.href) ? 'noreferrer' : undefined}
    >
      {children}
    </a>
  )
}

function ExhibitDialog({ item, allItems, onClose, onSelect }) {
  const closeRef = useRef(null)
  const index = allItems.findIndex((candidate) => candidate.id === item.id)
  const previous = index > 0 ? allItems[index - 1] : null
  const next = index < allItems.length - 1 ? allItems[index + 1] : null
  const typeTone = TYPE_TONES[item.type] || TYPE_TONES.product

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && previous) onSelect(previous)
      if (event.key === 'ArrowRight' && next) onSelect(next)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [next, onClose, onSelect, previous])

  return (
    <div className={styles.dialogBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="exhibit-dialog-title">
        <button ref={closeRef} type="button" className={styles.dialogClose} onClick={onClose} aria-label="关闭展品详情">
          <span aria-hidden="true">×</span>
        </button>

        <div className={styles.dialogVisual}>
          <MuseumPoster item={item} index={index} />
        </div>
        <div className={styles.dialogContent} style={{ '--detail-accent': typeTone.accent }}>
          <p className={styles.eyebrow}>Collection No. {String(index + 1).padStart(3, '0')}</p>
          <h2 id="exhibit-dialog-title">{item.title}</h2>
          <p className={styles.dialogRole}>{item.role}</p>
          <p className={styles.dialogSummary}>{item.summary}</p>

          <dl className={styles.detailList}>
            <div>
              <dt>展品状态</dt>
              <dd>{STATUS_LABELS[item.status] || item.status}</dd>
            </div>
            <div>
              <dt>展厅</dt>
              <dd>{item.typeLabel}</dd>
            </div>
            {item.domains?.length ? (
              <div>
                <dt>线上地址</dt>
                <dd>{item.domains.join(' / ')}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.dialogTags}>
            {item.tags?.map((tag) => <span key={tag}>{tag}</span>)}
          </div>

          <WorkLink item={item} className={styles.primaryAction}>
            {item.actionLabel || (isExternal(item.href) ? '进入线上项目' : '打开站内作品')}
            <ArrowIcon />
          </WorkLink>

          <nav className={styles.dialogNav} aria-label="切换展品">
            <button type="button" onClick={() => previous && onSelect(previous)} disabled={!previous}>
              <ArrowIcon direction="left" /> 上一件
            </button>
            <span>{numberLabel(index)} / {String(allItems.length).padStart(2, '0')}</span>
            <button type="button" onClick={() => next && onSelect(next)} disabled={!next}>
              下一件 <ArrowIcon />
            </button>
          </nav>
        </div>
      </section>
    </div>
  )
}

export default function WorksMuseumClient({ featuredItems, sections, items, operatingCount }) {
  const [activeFeatured, setActiveFeatured] = useState(0)
  const [selectedItem, setSelectedItem] = useState(null)
  const [archiveFilter, setArchiveFilter] = useState('all')
  const featuredViewportRef = useRef(null)
  const featuredRefs = useRef([])

  const typeLabels = useMemo(
    () => Object.fromEntries(sections.map((section) => [section.id, section.title])),
    [sections]
  )
  const normalizedItems = useMemo(
    () => items.map((item) => ({ ...item, typeLabel: typeLabels[item.type] || item.type })),
    [items, typeLabels]
  )
  const filteredItems = archiveFilter === 'all'
    ? normalizedItems
    : normalizedItems.filter((item) => item.type === archiveFilter)

  useEffect(() => {
    const viewport = featuredViewportRef.current
    if (!viewport) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveFeatured(Number(visible.target.dataset.featuredIndex))
      },
      { root: viewport, threshold: [0.55, 0.75] }
    )

    featuredRefs.current.forEach((node) => node && observer.observe(node))
    return () => observer.disconnect()
  }, [featuredItems])

  function scrollToFeatured(index) {
    const nextIndex = Math.max(0, Math.min(featuredItems.length - 1, index))
    const viewport = featuredViewportRef.current
    const slide = featuredRefs.current[nextIndex]
    if (!viewport || !slide) return
    viewport.scrollTo({ left: slide.offsetLeft - viewport.offsetLeft, behavior: 'smooth' })
  }

  function handleFeaturedKeyDown(event) {
    if (event.key === 'ArrowLeft') scrollToFeatured(activeFeatured - 1)
    if (event.key === 'ArrowRight') scrollToFeatured(activeFeatured + 1)
  }

  function openItem(item) {
    setSelectedItem(normalizedItems.find((candidate) => candidate.id === item.id) || item)
  }

  return (
    <div className={styles.root}>
      <header className={styles.entrance}>
        <div className={styles.entranceGrid} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className={styles.entranceInner}>
          <div className={styles.entranceCopy}>
            <p className={styles.kicker}>Digital Works Exhibition · 2026</p>
            <h1>作品展厅</h1>
            <p className={styles.entranceLead}>把写作、工程与 AI 做成可以进入、观察和持续运行的系统。</p>
            <a className={styles.enterButton} href="#featured-exhibition">
              进入主展 <ArrowIcon />
            </a>
          </div>

          <div className={styles.entranceStats} aria-label="展览数据">
            <div><strong>{items.length}</strong><span>件数字作品</span></div>
            <div><strong>{sections.length}</strong><span>个主题展厅</span></div>
            <div><strong>{operatingCount}</strong><span>件持续运营</span></div>
          </div>

          <div className={styles.entranceLabel}>
            <span>CURATED BY TUARAN</span>
            <span>GUANGZHOU / WEB</span>
          </div>
        </div>
      </header>

      <section id="featured-exhibition" className={styles.featuredSection} aria-labelledby="featured-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Featured Exhibition</p>
            <h2 id="featured-title">本期主展</h2>
          </div>
          <p>三件长期经营的代表作品。拖动展墙，或使用方向键参观。</p>
        </div>

        <div
          ref={featuredViewportRef}
          className={styles.featuredViewport}
          tabIndex={0}
          onKeyDown={handleFeaturedKeyDown}
          aria-label="重点作品轮播"
        >
          <div className={styles.featuredTrack}>
            {featuredItems.map((item, index) => (
              <article
                key={item.id}
                ref={(node) => { featuredRefs.current[index] = node }}
                data-featured-index={index}
                className={styles.featuredSlide}
              >
                <div className={styles.featuredInfo}>
                  <div className={styles.exhibitNumber}>主展 · {numberLabel(index)}</div>
                  <span className={styles.status}>{STATUS_LABELS[item.status] || item.status}</span>
                  <h3>{item.title}</h3>
                  <p className={styles.featuredRole}>{item.role}</p>
                  <p className={styles.featuredSummary}>{item.summary}</p>
                  <button type="button" className={styles.textAction} onClick={() => openItem(item)}>
                    查看展品说明 <ArrowIcon />
                  </button>
                </div>
                <button type="button" className={styles.posterButton} onClick={() => openItem(item)} aria-label={`查看 ${item.title} 详情`}>
                  <MuseumPoster item={item} index={index} />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.carouselControls}>
          <button type="button" onClick={() => scrollToFeatured(activeFeatured - 1)} disabled={activeFeatured === 0} aria-label="上一件主展作品">
            <ArrowIcon direction="left" />
          </button>
          <div className={styles.progressRail}>
            {featuredItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeFeatured ? styles.progressActive : ''}
                onClick={() => scrollToFeatured(index)}
                aria-label={`转到第 ${index + 1} 件：${item.title}`}
              >
                <span>{numberLabel(index)}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => scrollToFeatured(activeFeatured + 1)} disabled={activeFeatured === featuredItems.length - 1} aria-label="下一件主展作品">
            <ArrowIcon />
          </button>
        </div>
      </section>

      <nav className={styles.roomDirectory} aria-label="展厅导航">
        <div className={styles.directoryTitle}>
          <span>Floor Directory</span>
          <strong>展区导览</strong>
          <p>按作品用途分区：先看长期产品，再看 AI 工程、研究页面和可下载工具。</p>
        </div>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#room-${section.id}`}>
                <span>{numberLabel(index)}</span>
                <strong>
                  {section.title}
                  <small>{section.description}</small>
                </strong>
                <em>{section.items.length}</em>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.rooms}>
        {sections.map((section, sectionIndex) => {
          const tone = TYPE_TONES[section.id] || TYPE_TONES.product
          const sorted = [...section.items].sort((a, b) => (b.priority || 0) - (a.priority || 0))
          return (
            <section
              id={`room-${section.id}`}
              key={section.id}
              className={styles.room}
              style={{ '--room-accent': tone.accent, '--room-wash': tone.wash }}
              aria-labelledby={`room-title-${section.id}`}
            >
              <aside className={styles.roomIntro}>
                <p>{numberLabel(sectionIndex)} / {section.titleEn}</p>
                <h2 id={`room-title-${section.id}`}>{section.title}</h2>
                <div className={styles.roomCount}>{String(sorted.length).padStart(2, '0')}</div>
                <p>{section.description}</p>
              </aside>

              <div className={styles.roomWall}>
                {sorted.map((item, index) => (
                  <article key={item.id} className={`${styles.wallExhibit} ${index === 0 ? styles.wallExhibitLead : ''}`}>
                    <button type="button" className={styles.wallPosterButton} onClick={() => openItem(item)} aria-label={`查看 ${item.title} 详情`}>
                      <MuseumPoster item={item} index={index} compact={index !== 0} />
                    </button>
                    <div className={styles.wallLabel}>
                      <span>{String(sectionIndex + 1).padStart(2, '0')}.{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.role}</p>
                      </div>
                      <button type="button" onClick={() => openItem(item)} aria-label={`打开 ${item.title} 展签`}>
                        +
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className={styles.archive} aria-labelledby="archive-title">
        <div className={styles.archiveHeader}>
          <div>
            <p className={styles.eyebrow}>Open Collection</p>
            <h2 id="archive-title">典藏目录</h2>
          </div>
          <p>完整作品索引。适合快速筛选、检索与直接访问。</p>
        </div>

        <div className={styles.archiveFilters} aria-label="筛选典藏目录">
          <button type="button" className={archiveFilter === 'all' ? styles.filterActive : ''} onClick={() => setArchiveFilter('all')}>
            全部 <span>{items.length}</span>
          </button>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={archiveFilter === section.id ? styles.filterActive : ''}
              onClick={() => setArchiveFilter(section.id)}
            >
              {section.title} <span>{section.items.length}</span>
            </button>
          ))}
        </div>

        <div className={styles.archiveList}>
          {filteredItems.map((item) => {
            const originalIndex = normalizedItems.findIndex((candidate) => candidate.id === item.id)
            return (
              <article key={item.id}>
                <span className={styles.archiveNumber}>{String(originalIndex + 1).padStart(3, '0')}</span>
                <div className={styles.archiveMain}>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
                <div className={styles.archiveMeta}>
                  <span>{item.typeLabel}</span>
                  <span>{STATUS_LABELS[item.status] || item.status}</span>
                </div>
                <button type="button" className={styles.archiveOpen} onClick={() => openItem(item)}>
                  展品说明 <ArrowIcon />
                </button>
              </article>
            )
          })}
        </div>
      </section>

      {selectedItem ? (
        <ExhibitDialog
          item={selectedItem}
          allItems={normalizedItems}
          onClose={() => setSelectedItem(null)}
          onSelect={setSelectedItem}
        />
      ) : null}
    </div>
  )
}
