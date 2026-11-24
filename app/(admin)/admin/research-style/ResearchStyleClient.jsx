'use client'

import { useMemo, useState } from 'react'

import { RESEARCH_STYLE_TEMPLATES, UNIVERSAL_BAN_PHRASES } from '../../../../lib/research/researchStyleTemplates'
import { RESEARCH_STYLE_AUDIT } from '../../../../lib/research/styleAudit'
import { AdminPage } from '../../components/ui'
import {
  BookFigure,
  BookPara,
  BookPoints,
  BookProse,
  BookSection,
  BookTable,
  PaperPage,
  chapterLabel,
  folioFor,
} from '../../components/ResearchBook'

function ResearchStyleFrame({ embedded, children }) {
  if (embedded) return children
  return (
    <AdminPage
      title="内容风格库"
      description="先定写法，再写内容。这里既是风格配置，也是存量文章的措辞复核入口。"
    >
      {children}
    </AdminPage>
  )
}

const STATUS_TONE = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  available: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  draft: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
}

const STATUS_LABEL = {
  active: '默认风格',
  available: '可选风格',
  draft: '草稿',
}

const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.available
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
      {children}
    </h3>
  )
}

function StylePill({ style, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? 'border-[#15140f] bg-[#15140f] text-white shadow-sm dark:border-gray-100 dark:bg-gray-100 dark:text-[#0e0e0a]'
          : 'border-[#caccc0] bg-white text-[#15140f] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200 dark:hover:border-[#4a5568]'
      }`}
    >
      <span className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>
        {style.category}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold leading-tight">{style.label}</span>
          <StatusChip status={style.status} />
        </span>
        <span className={`truncate font-mono text-[9px] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>{style.id}</span>
      </span>
    </button>
  )
}

function PhraseList({ items, accent }) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#caccc0] bg-[#fafaf6] px-4 py-3 text-[13px] text-[#73746a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-[#9aa3b3]">
        本风格无专项示例。
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((it, idx) => (
        <li
          key={idx}
          className="rounded-lg border border-[#e6e6dc] bg-white px-4 py-3 dark:border-[#2d3744] dark:bg-[#10161f]"
        >
          <p className={`mb-1 text-[13px] font-semibold leading-snug ${accent}`}>{it.phrase}</p>
          <p className="text-[12px] leading-relaxed text-[#73746a] dark:text-[#9aa3b3]">{it.why}</p>
        </li>
      ))}
    </ul>
  )
}

function AxiomList({ items, auditById }) {
  return (
    <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it, idx) => (
        <li
          key={it.phrase}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-rose-200 bg-white px-3 py-2.5 dark:border-rose-900/60 dark:bg-[#10161f]"
        >
          <span className="flex h-7 w-9 items-center justify-center rounded-md bg-rose-100 font-mono text-[11px] font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-rose-700 dark:text-rose-300">
              {it.phrase}
            </span>
            <span className="mt-1 block text-[12px] leading-5 text-[#73746a] dark:text-[#9aa3b3]">
              {it.why}
            </span>
            {auditById.get(it.id)?.occurrences ? (
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] ${it.severity === 'review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'}`}>
                存量 {auditById.get(it.id).occurrences} 处{it.severity === 'review' ? '，待人工判断' : '，待修改'}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

function TextList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`space-y-1.5 ${ordered ? 'pl-4' : ''}`}>
      {items.map((item, index) => (
        <li
          key={index}
          className={`${ordered ? 'list-decimal' : 'flex items-start gap-2'} text-[13px] leading-relaxed text-[#15140f] dark:text-gray-100`}
        >
          {ordered ? null : <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#15140f] dark:bg-gray-100" />}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  )
}

/* ── 书页体例：篇 / 章 / 节 / 段 / 点 / 表 / 图 ───────────────────────── */

function BookRulesContent() {
  const auditById = useMemo(() => new Map(RESEARCH_STYLE_AUDIT.rules.map((rule) => [rule.id, rule])), [])
  const rows = UNIVERSAL_BAN_PHRASES.map((it, idx) => {
    const count = auditById.get(it.id)?.occurrences || 0
    const disposal = count
      ? `存量 ${count} 处，${it.severity === 'review' ? '待人工判断' : '待修改'}`
      : '暂未发现存量'
    return [CN_NUM[idx] || String(idx + 1), it.phrase, it.why, disposal]
  })

  return (
    <>
      <BookSection num="第一节" title="规则的来源">
        <BookPara>
          措辞规则分成两层。通用禁语对所有风格生效，各风格自己的禁用表达是补充。构建之前先扫描稿件的
          Markdown，强制禁语直接列为待改，其余候选句由人结合上下文判断。
        </BookPara>
      </BookSection>

      <BookSection num="第二节" title="通用禁语一览">
        <BookPara>
          「不是 X，而是 Y」属于强制禁语，需要表达对照时拆成两句具体事实。其余候选表达由规则扫出，是否改动由人决定。
        </BookPara>
        <BookTable
          label="表一"
          title="所有风格通用的禁语"
          head={['序', '禁语', '为什么禁', '处置']}
          rows={rows}
        />
      </BookSection>

      <BookSection num="第三节" title="存量处置">
        <BookPara>
          本次共扫描 {RESEARCH_STYLE_AUDIT.scannedFiles} 篇稿件，其中待修改{' '}
          {RESEARCH_STYLE_AUDIT.fixCount} 处，待人工判断 {RESEARCH_STYLE_AUDIT.reviewCount} 处。
          数字随稿件增减，以规则库和审计快照为准。
        </BookPara>
      </BookSection>
    </>
  )
}

const WRITING_ORDER = [
  ['选风格', '先定写法'],
  ['列事实', '摊开材料'],
  ['写判断', '人做取舍'],
  ['审措辞', '跑一次规则'],
]

function WritingOrderFigure() {
  const boxW = 112
  const boxH = 44
  const gap = 30
  const y = 12
  const totalW = WRITING_ORDER.length * boxW + (WRITING_ORDER.length - 1) * gap

  return (
    <svg
      viewBox={`0 0 ${totalW} 72`}
      width="100%"
      role="img"
      aria-label="写作顺序：选风格，列事实，写判断，审措辞"
      style={{ display: 'block', height: 'auto' }}
    >
      <defs>
        <marker id="book-order-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
        </marker>
      </defs>
      {WRITING_ORDER.map(([name, sub], i) => {
        const x = i * (boxW + gap)
        return (
          <g key={name}>
            <rect x={x} y={y} width={boxW} height={boxH} rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
            <text x={x + boxW / 2} y={y + 19} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor">
              {name}
            </text>
            <text x={x + boxW / 2} y={y + 35} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.68">
              {sub}
            </text>
            {i < WRITING_ORDER.length - 1 ? (
              <line
                x1={x + boxW + 5}
                y1={y + boxH / 2}
                x2={x + boxW + gap - 6}
                y2={y + boxH / 2}
                stroke="currentColor"
                strokeWidth="1"
                markerEnd="url(#book-order-arrow)"
              />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

function BookStyleDetail({ style }) {
  if (!style) return null
  const toRows = (items) => (items || []).map((it) => [it.phrase, it.why])

  return (
    <>
      <BookSection num="第三节" title={`${style.label} · 定位`}>
        <BookPara>{style.summary}</BookPara>
        <BookPara>{style.whyItMatters}</BookPara>
        {style.sourceSkills?.length ? (
          <BookPara>关联技能：{style.sourceSkills.join('、')}。</BookPara>
        ) : null}
      </BookSection>

      <BookSection num="第四节" title="适用场景">
        <BookPara>{style.trigger}</BookPara>
      </BookSection>

      <BookSection num="第五节" title="调用指令">
        <BookPoints items={style.commandHints} />
      </BookSection>

      <BookSection num="第六节" title="核心原则">
        <BookPoints items={style.principles} />
      </BookSection>

      <BookSection num="第七节" title="结构骨架">
        <BookPoints items={style.structure} ordered />
      </BookSection>

      <BookSection num="第八节" title="禁用表达">
        <BookTable
          label="表二"
          title={`${style.label} · 禁用表达`}
          head={['表达', '为什么禁']}
          rows={toRows(style.badPhrases)}
          note="通用禁语见表一；此处只列本风格补充的条目。"
        />
      </BookSection>

      <BookSection num="第九节" title="建议表达">
        <BookTable
          label="表三"
          title={`${style.label} · 建议表达`}
          head={['表达', '为什么用']}
          rows={toRows(style.goodPhrases)}
        />
      </BookSection>

      <BookSection num="第十节" title="落地清单">
        <BookPoints items={style.howToApply} ordered />
      </BookSection>
    </>
  )
}

function RulesContent({ defaultOpen = false }) {
  const [showRules, setShowRules] = useState(defaultOpen)
  const auditById = useMemo(() => new Map(RESEARCH_STYLE_AUDIT.rules.map((rule) => [rule.id, rule])), [])
  const totalFindings = RESEARCH_STYLE_AUDIT.fixCount + RESEARCH_STYLE_AUDIT.reviewCount

  return (
    <>
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">执行状态</p>
              <h2 className="mt-1 text-[17px] font-semibold text-[#15140f] dark:text-gray-100">规则已入库，存量内容尚未完全收敛</h2>
              <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">
                构建前会扫描文章 Markdown；强制禁语直接列为待改，其它候选表达再由人工判断。
              </p>
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {totalFindings} 项待复核
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-[#e6e6dc] rounded-xl border border-[#e6e6dc] bg-[#fafaf6] dark:divide-[#2d3744] dark:border-[#2d3744] dark:bg-[#0e131c]">
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">已扫描</dt>
              <dd className="mt-1 text-lg font-semibold text-[#15140f] dark:text-gray-100">{RESEARCH_STYLE_AUDIT.scannedFiles}<span className="ml-1 text-[11px] font-normal text-[#73746a]">篇</span></dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">待修改</dt>
              <dd className="mt-1 text-lg font-semibold text-rose-700 dark:text-rose-300">{RESEARCH_STYLE_AUDIT.fixCount}<span className="ml-1 text-[11px] font-normal text-[#73746a]">处</span></dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">人工判断</dt>
              <dd className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-300">{RESEARCH_STYLE_AUDIT.reviewCount}<span className="ml-1 text-[11px] font-normal text-[#73746a]">处</span></dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-200">所有风格的底线</p>
          <h2 className="mt-1 text-[17px] font-semibold text-[#15140f] dark:text-gray-100">先不像 AI 写的，再谈风格</h2>
          <p className="mt-1.5 text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">{UNIVERSAL_BAN_PHRASES.length} 条通用措辞规则，风格自己的禁用表达只是补充。</p>
          <button
            type="button"
            onClick={() => setShowRules((value) => !value)}
            className="mt-4 inline-flex items-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-800 transition hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#10161f] dark:text-rose-200"
          >
            {showRules ? '收起通用规则' : '查看通用规则'}
          </button>
        </div>
      </section>

      {showRules ? (
        <section className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="mb-4">
            <SectionTitle>公理 · 所有风格通用禁语</SectionTitle>
            <p className="m-0 max-w-4xl text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">
              「不是 X，而是 Y」是强制禁语；其它候选句由规则扫描提示，再结合上下文人工处理。
            </p>
          </div>
          <AxiomList items={UNIVERSAL_BAN_PHRASES} auditById={auditById} />
        </section>
      ) : null}
    </>
  )
}

function RulesPanel({ defaultOpen = false }) {
  return <RulesContent defaultOpen={defaultOpen} />
}

function BookRulesPanel() {
  return (
    <PaperPage
      chapter={chapterLabel(0, '写作规范')}
      title="写作规范"
      summary="所有调研共同遵守的措辞底线。机器负责扫出候选句，是否要改由人结合上下文判断。"
      folio={folioFor(0)}
    >
      <BookProse>
        <BookRulesContent />
      </BookProse>
    </PaperPage>
  )
}

function StylesPanel({ book = false }) {
  const styles = useMemo(() => [...RESEARCH_STYLE_TEMPLATES], [])
  const initial = styles.find((t) => t.status === 'active') || styles[0]
  const [selectedId, setSelectedId] = useState(initial?.id)
  const selected = styles.find((t) => t.id === selectedId) || initial
  const activeRow = Math.max(0, styles.findIndex((s) => s.id === selected?.id))

  const orderNote = (
    <div className="rounded-xl border border-dashed border-[#caccc0] bg-transparent p-3 text-[11px] leading-relaxed text-[#73746a] dark:border-[#2d3744] dark:text-[#9aa3b3]">
      <p className="mb-1 font-semibold text-[#51514a] dark:text-gray-300">写作顺序</p>
      <p className="m-0">
        选风格 → 先列事实 → 写判断 → 跑一次措辞审计。规则正本在 <code>researchStyleTemplates.js</code>。
      </p>
    </div>
  )

  if (book) {
    return (
      <PaperPage
        chapter={chapterLabel(1, '调研风格')}
        title="调研风格"
        summary="先定写法，再写内容。同一组事实用不同风格写出来，取舍仍由人做。"
        folio={folioFor(1)}
      >
        <BookSection num="第一节" title="六种写法">
          <BookPara>
            写法决定材料的取舍和语气。选中一种，下文展开它的定位、原则与骨架。
          </BookPara>
          <BookTable
            label="表一"
            title="六种写法对照"
            head={['序', '写法', '类别']}
            rows={styles.map((style, i) => [
              CN_NUM[i] || String(i + 1),
              style.label,
              STATUS_LABEL[style.status] || style.status,
            ])}
            onSelect={(i) => setSelectedId(styles[i].id)}
            activeRow={activeRow}
            note="选中一行，下文展开该写法的完整体例。"
          />
        </BookSection>

        <BookSection num="第二节" title="写作顺序">
          <BookFigure
            label="图一"
            title="从选风格到审计措辞"
            note="先定写法，再摊开事实、落下判断，最后跑一次措辞审计。"
          >
            <WritingOrderFigure />
          </BookFigure>
        </BookSection>

        <BookStyleDetail style={selected} />
      </PaperPage>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
      <aside className="space-y-4 md:sticky md:top-[72px] md:self-start">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>选择写作风格</SectionTitle>
            <span className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">{styles.length} 种</span>
          </div>
          <ol className="space-y-2">
            {styles.map((style) => (
              <li key={style.id}>
                <StylePill style={style} active={style.id === selectedId} onClick={() => setSelectedId(style.id)} />
              </li>
            ))}
          </ol>
        </div>
        {orderNote}
      </aside>

      <section>
        <StyleCard style={selected} />
      </section>
    </div>
  )
}

export default function ResearchStyleClient({ embedded = false, view = 'all', book = false }) {
  const showRules = view === 'all' || view === 'rules'
  const showStyles = view === 'all' || view === 'styles'

  if (book) {
    return (
      <>
        {showRules ? <BookRulesPanel /> : null}
        {showStyles ? <StylesPanel book /> : null}
      </>
    )
  }

  return (
    <ResearchStyleFrame embedded={embedded}>
      {showRules ? <RulesPanel defaultOpen={view === 'rules'} /> : null}
      {showStyles ? <StylesPanel /> : null}
    </ResearchStyleFrame>
  )
}

function StyleCard({ style, book = false }) {
  if (!style) return null

  const card = (
    <article className={book ? '' : 'rounded-2xl border border-[#caccc0] bg-white p-6 shadow-sm dark:border-[#2d3744] dark:bg-[#10161f] md:p-8'}>
      <header className={`mb-5 border-b border-[#e6e6dc] pb-4 dark:border-[#2d3744] ${book ? '' : 'flex flex-wrap items-center justify-between gap-3'}`}>
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
            {style.category} · {style.id}
          </p>
          <h2 className={`font-serif font-semibold text-[#15140f] dark:text-gray-100 ${book ? 'text-[1.3rem]' : 'text-[1.5rem] md:text-[1.75rem]'}`}>
            {style.label}
          </h2>
          <p className="mt-1 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
            {style.summary}
          </p>
        </div>
        <StatusChip status={style.status} />
      </header>

      <div className="grid gap-6">
        <div>
          <SectionTitle>适用场景</SectionTitle>
          <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
            {style.trigger}
          </p>
        </div>

        <div>
          <SectionTitle>调用指令</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {style.commandHints.map((hint) => (
              <li
                key={hint}
                className="rounded-full border border-[#caccc0] bg-white px-3 py-1.5 font-mono text-[11px] text-[#51514a] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300"
              >
                {hint}
              </li>
            ))}
          </ul>
        </div>

        {style.sourceSkills?.length ? (
          <div>
            <SectionTitle>关联 Skill</SectionTitle>
            <ul className="flex flex-wrap gap-2">
              {style.sourceSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-[#cfc3e2] bg-[#f3eff9] px-3 py-1.5 font-mono text-[11px] text-[#49345f] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <SectionTitle>核心原则</SectionTitle>
          <TextList items={style.principles} />
        </div>

        <div>
          <SectionTitle>结构骨架</SectionTitle>
          <TextList items={style.structure} ordered />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>禁用表达</SectionTitle>
          <PhraseList items={style.badPhrases} accent="text-rose-700 dark:text-rose-300" />
        </div>
        <div>
          <SectionTitle>建议表达</SectionTitle>
          <PhraseList items={style.goodPhrases} accent="text-emerald-700 dark:text-emerald-300" />
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>落地清单</SectionTitle>
        <TextList items={style.howToApply} ordered />
      </div>

      <div className="mt-6">
        <SectionTitle>为什么这么定</SectionTitle>
        <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
          {style.whyItMatters}
        </p>
      </div>
    </article>
  )

  return book ? <BookProse>{card}</BookProse> : card
}
