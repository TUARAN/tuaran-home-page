import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage, CollapsibleSection, Section, StatCard, StatusPill } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import audit from '../../../../ai-context/ui-ux-audit-roadmap.md?raw'
import language from '../../../../docs/site-design-language.md?raw'
import motion from '../../../../docs/loading-motion-system.md?raw'
import { countAuditTasks } from './designDocuments'

export const metadata = {
  title: 'UI 设计',
  description: '站点设计规范、UI 交互审计与改造记录，仅站长可见。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const documents = [
  { id: 'audit', title: 'UI / 交互审计与改造清单', source: 'ai-context/ui-ux-audit-roadmap.md', markdown: audit, showProgress: true },
  { id: 'language', title: '站点设计语言', source: 'docs/site-design-language.md', markdown: language },
  { id: 'motion', title: '加载与等待反馈规范', source: 'docs/loading-motion-system.md', markdown: motion },
]

const documentLinks = {
  'ui-ux-audit-roadmap.md': '/admin/design#audit',
  'site-design-language.md': '/admin/design#language',
  'loading-motion-system.md': '/admin/design#motion',
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
          className={`admin-document-sections -mx-4 -mb-4 md:-mx-5 ${
            introMarkdown ? 'mt-3 border-t border-[var(--admin-line-soft)]' : '-mt-4'
          }`}
        >
          {sections.map((section, index) => {
            const split = section.indexOf('\n')
            const title = section.slice(0, split).trim()
            return (
              <CollapsibleSection
                key={title}
                id={`${document.id}-section-${index + 1}`}
                title={title}
                variant="nested"
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: renderDocument(section.slice(split + 1)) }}
                />
              </CollapsibleSection>
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
      <Section
        title={document.title}
        description={description}
        actions={document.showProgress && progress.total ? <StatusPill tone="info" size="sm">{progress.completed}/{progress.total} 项完成</StatusPill> : undefined}
      >
        {body}
      </Section>
    </div>
  )
}

export default function AdminDesignPage() {
  const { completed, total } = countAuditTasks(audit)
  return (
    <AdminPageGate label="UI 设计" returnTo="/admin/design">
      <AdminPage
        title="UI 设计"
        description="集中查看设计规范、界面交互问题和改造验收；运行质量与流量异常已拆分到站点体检。"
        actions={<><AdminButton href="/admin/site-health" size="sm">站点体检</AdminButton><AdminButton href="/admin/seo" size="sm">SEO 管理</AdminButton><AdminButton href="/admin/planning" size="sm">规划与待办</AdminButton></>}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="归档任务进度" value={`${completed}/${total}`} sub="以审计文档的勾选记录为准" icon="planning" tone="info" />
          <StatCard label="审计基线" value="2026-09-08" sub="GPT6-Astra · 桌面观察与代码审计" icon="researchStyle" />
          <StatCard label="验证状态" value="待复测" sub="移动端、多主题与完整交互尚未验证" icon="audit" tone="warning" />
        </div>
        <nav aria-label="设计文档导航" className="my-5 flex flex-wrap gap-2">
          {documents.map((document) => <AdminButton key={document.id} href={`#${document.id}`} size="sm">{document.title}</AdminButton>)}
        </nav>
        <p className="mb-5 text-sm leading-7 text-[var(--admin-muted)]">
          先修手机长文目录、动态内容失败提示，以及后台概览和设计令牌。三份设计文档直接展示，各章节可按需展开；修改文档后随部署同步。具体执行进入“规划与待办”，当前尚未自动同步任务。
        </p>
        <div className="space-y-5">{documents.map((document) => <DocumentSection key={document.id} document={document} />)}</div>
      </AdminPage>
    </AdminPageGate>
  )
}
