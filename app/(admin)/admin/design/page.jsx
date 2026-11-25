import AdminBook, { AdminBookChapter } from '../../components/AdminBook'
import AdminPageGate from '../../components/AdminPageGate'
import { AdminPage, StatusPill } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import audit from '../../../../docs/context/ui-ux-audit-roadmap.md?raw'
import language from '../../../../docs/specs/site-design-language.md?raw'
import motion from '../../../../docs/specs/loading-motion-system.md?raw'
import bookReader from '../../../../docs/specs/resource-book-reader.md?raw'
import { countAuditTasks } from './designDocuments'

export const metadata = {
  title: 'UI 设计',
  description: '站点设计规范、UI 交互审计与改造记录，仅站长可见。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const documents = [
  { id: 'audit', title: 'UI / 交互审计与改造清单', source: 'docs/context/ui-ux-audit-roadmap.md', markdown: audit, showProgress: true },
  { id: 'language', title: '站点设计语言', source: 'docs/specs/site-design-language.md', markdown: language },
  { id: 'motion', title: '加载与等待反馈规范', source: 'docs/specs/loading-motion-system.md', markdown: motion },
  { id: 'book-reader', title: '资源书籍阅读模板', source: 'docs/specs/resource-book-reader.md', markdown: bookReader },
]

const documentLinks = {
  'ui-ux-audit-roadmap.md': '/admin/design#audit',
  'site-design-language.md': '/admin/design#language',
  'loading-motion-system.md': '/admin/design#motion',
  'resource-book-reader.md': '/admin/design#book-reader',
  'seo-geo-growth-roadmap.md': '/admin/seo#growth-roadmap',
}

function renderDocument(markdown) {
  const linked = markdown.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, label, target) => {
    if (/^https?:\/\//.test(target)) return match
    const destination = documentLinks[target.split('/').pop()]
    return destination ? `[${label}](${destination})` : `${label}（仓库文档：\`${target}\`）`
  })
  return renderMarkdown(linked)
}

function DocumentBody({ document }) {
  const [intro, ...sections] = document.markdown.replace(/^# .+\n/, '').split(/^## /m)
  const introMarkdown = intro.trim()
  return (
    <div className="admin-document">
      {introMarkdown ? (
        <div
          className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: renderDocument(introMarkdown) }}
        />
      ) : null}
      {sections.length ? (
        <div
          className="admin-document-sections"
        >
          {sections.map((section, index) => {
            const split = section.indexOf('\n')
            const title = section.slice(0, split).trim()
            return (
              <section
                key={title}
                id={`${document.id}-section-${index + 1}`}
                aria-label={title}
                className="scroll-mt-28 border-t border-[var(--admin-line-soft)] mt-6 pt-2"
              >
                <h3 className="mt-8 font-serif text-xl font-semibold">{title}</h3>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: renderDocument(section.slice(split + 1)) }}
                />
              </section>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function DocumentSection({ document }) {
  const description = `记录来源：${document.source}`
  const body = <DocumentBody document={document} />
  const progress = countAuditTasks(document.markdown)
  return (
    <div id={document.id} className="scroll-mt-24">
      <AdminBookChapter
        title={document.title}
        description={description}
        actions={document.showProgress && progress.total ? <StatusPill tone="info" size="sm">{progress.completed}/{progress.total} 项完成</StatusPill> : undefined}
      >
        {body}
      </AdminBookChapter>
    </div>
  )
}

export default function AdminDesignPage() {
  return (
    <AdminPageGate label="UI 设计" returnTo="/admin/design">
      <AdminPage hideTitle title="UI 设计">
        <AdminBook title="UI 设计" description="设计规范与界面审计" groups={documents.map(document => ({ id: document.id, label: document.title, items: [
          { id: document.id, title: '概览与来源' },
          ...document.markdown.replace(/^# .+\n/, '').split(/^## /m).slice(1).map((section, index) => ({ id: `${document.id}-section-${index + 1}`, title: section.split('\n')[0].trim() })),
        ] }))}>{documents.map(document => <DocumentSection key={document.id} document={document} />)}</AdminBook>
      </AdminPage>
    </AdminPageGate>
  )
}
