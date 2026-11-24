import AdminPageGate from '../../components/AdminPageGate'
import MemoryVault from '../../../(site)/context-memory/MemoryVault'
import { AdminPage } from '../../components/ui'

// 标题与描述只在这里维护一次，metadata 与页面头部共用。
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
        <section className="rounded-2xl border border-[#dfe2da] bg-white/80 p-4 shadow-sm dark:border-[#1b2836] dark:bg-[#101820]/90 md:p-5">
          <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="border-b border-[#e6e7df] pb-4 dark:border-[#1b2836] xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
              <span className="inline-flex rounded-lg bg-[#e2f1ec] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#22715c] dark:bg-[#14332b] dark:text-[#83d0bb]">
                登录可见
              </span>
              <h2 className="mt-4 text-xl font-semibold text-[#15140f] dark:text-gray-100">
                查看快照
              </h2>
              <ol className="mt-4 space-y-2 text-sm leading-7 text-[#5a5a53] dark:text-gray-300">
                <li>1. 在右侧文件树选一份快照</li>
                <li>2. 正文自动加载</li>
                <li>3. 沿版本时间线切换历史版本</li>
              </ol>
              <p className="mt-5 border-t border-[#e6e7df] pt-4 text-xs leading-6 text-[#767869] dark:border-[#1b2836] dark:text-gray-400">
                内容存放在 D1，只通过后台 owner 鉴权的接口读取，不进仓库和公开静态目录。本地运行 pnpm snapshot-memory 写入新版本。
              </p>
            </aside>
            <div>
              <MemoryVault />
            </div>
          </div>
        </section>
      </AdminPage>
    </AdminPageGate>
  )
}
