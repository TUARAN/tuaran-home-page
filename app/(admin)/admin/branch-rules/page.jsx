import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage, CollapsibleSection, Section } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import rules from '../../../../docs/specs/branch-management.md?raw'

export const metadata = {
  title: '分支规范',
  description: '分支命名、生命周期、数量上限、合并后清理与归档规则，仅站长可见。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const LINKS = {
  'issue-first-workflow.md': '/admin/site-dev',
}

function render(markdown) {
  const linked = markdown.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, label, target) => {
    if (/^https?:\/\//.test(target)) return match
    const destination = LINKS[target.split('/').pop()]
    return destination ? `[${label}](${destination})` : `${label}（仓库文档：\`${target}\`）`
  })
  return renderMarkdown(linked)
}

export default function AdminBranchRulesPage() {
  const [intro, ...sections] = rules.replace(/^# .+\n/, '').split(/^## /m)
  return (
    <AdminPageGate label="分支规范" returnTo="/admin/branch-rules">
      <AdminPage
        title="分支规范"
        description="分支怎么开、怎么合、怎么收。记录来源：docs/specs/branch-management.md，修改后随部署同步。"
        actions={<AdminButton href="/admin/site-dev" size="sm">开发发布</AdminButton>}
      >
        <Section title="适用范围">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: render(intro.trim()) }}
          />
        </Section>
        <div className="mt-5 space-y-3">
          {sections.map((section, index) => {
            const split = section.indexOf('\n')
            const title = section.slice(0, split).trim()
            return (
              <CollapsibleSection key={title} id={`branch-rules-${index + 1}`} title={title} defaultOpen={index < 3}>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: render(section.slice(split + 1)) }}
                />
              </CollapsibleSection>
            )
          })}
        </div>
      </AdminPage>
    </AdminPageGate>
  )
}
