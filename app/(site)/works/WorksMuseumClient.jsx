import styles from './works-museum.module.css'

const STATUS_LABELS = {
  operating: '运营中',
  building: '打磨中',
  experiment: '实验',
  shipped: '已上线',
  archived: '归档',
}

function isExternal(href) {
  return /^https?:\/\//.test(href)
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 16 16 4M7 4h9v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WorkItem({ item, index, sectionIndex }) {
  const number = `${String(sectionIndex + 1).padStart(2, '0')}.${String(index + 1).padStart(2, '0')}`

  return (
    <a
      href={item.href}
      className={styles.work}
      target={isExternal(item.href) ? '_blank' : undefined}
      rel={isExternal(item.href) ? 'noreferrer' : undefined}
      download={item.download ? '' : undefined}
    >
      <span className={styles.workNumber}>{number}</span>

      <div className={styles.workMain}>
        <div className={styles.workTitleRow}>
          <h3>{item.title}</h3>
          {item.featured ? <span className={styles.featured}>精选</span> : null}
        </div>
        <p className={styles.role}>{item.role}</p>
        <p className={styles.summary}>{item.summary}</p>
        {item.tags?.length ? (
          <div className={styles.tags} aria-label="技术与领域标签">
            {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        ) : null}
      </div>

      <div className={styles.workAside}>
        <span className={`${styles.status} ${styles[`status_${item.status}`] || ''}`}>
          <i aria-hidden="true" />
          {STATUS_LABELS[item.status] || item.status}
        </span>
        {item.domains?.[0] ? <span className={styles.domain}>{item.domains[0]}</span> : null}
        <span className={styles.action}>
          {item.actionLabel || (isExternal(item.href) ? '访问项目' : '打开作品')}
          <ArrowIcon />
        </span>
      </div>
    </a>
  )
}

export default function WorksMuseumClient({ sections, items, operatingCount }) {
  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <div className={styles.heroTopline}>
          <p>Selected Works · 2026</p>
          <span>Curated by TUARAN</span>
        </div>

        <div className={styles.heroGrid}>
          <div>
            <h1>作品展厅</h1>
            <p className={styles.lead}>长期运行的产品，以及真正进入现实世界的 AI 工程。</p>
          </div>

          <dl className={styles.stats} aria-label="作品概览">
            <div>
              <dt>作品</dt>
              <dd>{String(items.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>分类</dt>
              <dd>{String(sections.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>运营中</dt>
              <dd>{String(operatingCount).padStart(2, '0')}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className={styles.collection}>
        {sections.map((section, sectionIndex) => {
          const sorted = [...section.items].sort((a, b) => (b.priority || 0) - (a.priority || 0))
          return (
            <section
              key={section.id}
              className={`${styles.section} ${styles[`section_${section.id}`] || ''}`}
              aria-labelledby={`works-${section.id}`}
            >
              <header className={styles.sectionHeader}>
                <p>{String(sectionIndex + 1).padStart(2, '0')} / {section.titleEn}</p>
                <h2 id={`works-${section.id}`}>{section.title}</h2>
                <p className={styles.sectionDescription}>{section.description}</p>
                <span>{sorted.length} 件作品</span>
              </header>

              <div className={styles.workList}>
                {sorted.map((item, index) => (
                  <WorkItem key={item.id} item={item} index={index} sectionIndex={sectionIndex} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
