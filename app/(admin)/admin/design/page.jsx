import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage, CollapsibleSection, Section, StatCard } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import audit from '../../../../ai-context/ui-ux-audit-roadmap.md?raw'
import language from '../../../../docs/site-design-language.md?raw'
import motion from '../../../../docs/loading-motion-system.md?raw'
import { countAuditTasks, isCollapsedDesignDocument } from './designDocuments'

export const metadata = {
  title: '设计与体验',
  description: '站点设计规范、UI 交互审计与改造记录，仅站长可见。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const documents = [
  // kind: 'audit' 默认折叠。后续审计清单只要加上这个标记即可。
  { id: 'audit', kind: 'audit', title: 'UI / 交互审计与改造清单', source: 'ai-context/ui-ux-audit-roadmap.md', markdown: audit },
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
  return (
    <div className="admin-document prose prose-sm max-w-none dark:prose-invert">
      <div dangerouslySetInnerHTML={{ __html: renderDocument(intro) }} />
      {sections.map((section) => {
        const split = section.indexOf('\n')
        const title = section.slice(0, split).trim()
        return (
          <details key={title} className="my-2 rounded-lg border border-[var(--admin-line)]">
            <summary className="cursor-pointer px-4 py-3 font-semibold text-[var(--admin-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              {title}
            </summary>
            <div className="overflow-x-auto border-t border-[var(--admin-line)] px-4 py-2" dangerouslySetInnerHTML={{ __html: renderDocument(section.slice(split + 1)) }} />
          </details>
        )
      })}
    </div>
  )
}

function DocumentSection({ document }) {
  const description = `记录来源：${document.source}`
  const collapsedByDefault = isCollapsedDesignDocument(document)
  const body = <DocumentBody document={document} />
  if (!collapsedByDefault) {
    return (
      <div id={document.id} className="scroll-mt-24">
        <Section title={document.title} description={description}>
          {body}
        </Section>
      </div>
    )
  }
  const progress = countAuditTasks(document.markdown)
  return (
    <CollapsibleSection
      id={document.id}
      title={document.title}
      description={description}
      defaultOpen={false}
      badge={progress.total ? `${progress.completed}/${progress.total} 项完成` : undefined}
    >
      {body}
    </CollapsibleSection>
  )
}

export default function AdminDesignPage() {
  const { completed, total } = countAuditTasks(audit)
  return (
    <AdminPageGate label="设计与体验" returnTo="/admin/design">
      <AdminPage
        title="设计与体验"
        description="GPT6-Astra 分析与记录。集中查看设计规范、页面体验问题和改造验收，内容与项目文档保持一致。"
        actions={<><AdminButton href="/admin/seo" size="sm">SEO 管理</AdminButton><AdminButton href="/admin/planning" size="sm">规划与待办</AdminButton></>}
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
          先修手机长文目录、动态内容失败提示，以及后台概览和设计令牌。审计清单默认折叠，需要时再展开；修改文档后随部署同步。具体执行进入“规划与待办”，当前尚未自动同步任务。
        </p>
        <div className="space-y-5">{documents.map((document) => <DocumentSection key={document.id} document={document} />)}</div>
      </AdminPage>
    </AdminPageGate>
  )
}
