import AdminBook, { AdminBookChapter } from '../../components/AdminBook'
import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage } from '../../components/ui'
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
  const chapters = sections.map((section, index) => {
    const split = section.indexOf('\n')
    return { id: `branch-rules-${index + 1}`, title: section.slice(0, split).trim(), body: section.slice(split + 1) }
  })
  return (
    <AdminPageGate label="分支规范" returnTo="/admin/branch-rules">
      <AdminPage
        title="分支规范"
        description="分支怎么开、怎么合、怎么收。记录来源：docs/specs/branch-management.md，修改后随部署同步。"
        actions={<AdminButton href="/admin/site-dev" size="sm">开发发布</AdminButton>}
      >
        <AdminBook title="分支规范" description="分支命名、生命周期与归档" groups={[{ id: "rules", items: [{ id: "scope", title: "适用范围" }, ...chapters.map(({ id, title }) => ({ id, title }))] }]}><AdminBookChapter id="scope" title="适用范围">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: render(intro.trim()) }}
          />
        </AdminBookChapter>
        {chapters.map(chapter => <AdminBookChapter key={chapter.id} id={chapter.id} title={chapter.title}>
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: render(chapter.body) }} />
        </AdminBookChapter>)}
        </AdminBook>
      </AdminPage>
    </AdminPageGate>
  )
}
