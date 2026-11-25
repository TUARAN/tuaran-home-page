import AdminPageGate from '../../components/AdminPageGate'
import { AdminPage } from '../../components/ui'
import MemoryVault from './MemoryVault'

// 标题与描述只在这里维护一次，metadata、页面头部与书籍封面共用。
const PAGE_TITLE = '站点记忆'
const PAGE_DESCRIPTION =
  'Codex 项目规则与记忆、Claude Code 项目记忆及仓库 docs/context 文档的版本快照，登录后台即可查看，按版本时间线切换。'

export const metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContextMemoryPage() {
  return (
    <AdminPageGate>
      <AdminPage title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <MemoryVault description="登录可见 · 项目规则、工程记忆与上下文文档的版本快照" />
      </AdminPage>
    </AdminPageGate>
  )
}
