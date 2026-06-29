import AdminPageGate from '../../components/AdminPageGate'
import MemoryVault from '../../../(site)/context-memory/MemoryVault'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '上下文记忆',
  description: 'Claude Code / 仓库 ai-context 的加密记忆快照与版本时间线。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminContextMemoryPage() {
  return (
    <AdminPageGate
      label="上下文记忆"
      returnTo="/admin/context-memory"
      description="Claude Code / 仓库 ai-context 的加密记忆快照与版本时间线，仅站长本人可解密。"
    >
      <main className="mx-auto w-full max-w-[1580px] px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#dfe2da] bg-white/80 p-4 shadow-sm dark:border-[#1b2836] dark:bg-[#101820]/90 md:p-5">
          <div className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="border-b border-[#e6e7df] pb-4 dark:border-[#1b2836] xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
              <span className="inline-flex rounded-lg bg-[#e8eaec] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#3a4450] dark:bg-[#1f2935] dark:text-[#aebcce]">
                L5
              </span>
              <h1 className="mt-4 text-xl font-semibold text-[#15140f] dark:text-gray-100">
                实际运行中的记忆样本
              </h1>
              <p className="mt-4 text-sm leading-8 text-[#5a5a53] dark:text-gray-300">
                这一层是 Claude Code / 仓库 ai-context/ 里真实写下的内容快照。AES-GCM 加密上传，带版本时间线，密码只在本人浏览器里解密。
              </p>
            </aside>
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-[#c2c6b8] bg-[#f1f2ec] px-4 py-3 text-sm leading-7 text-[#575a43] dark:border-[#33425a] dark:bg-[#0a1119] dark:text-[#a9b3c4]">
                本板块现在收敛到后台管理：公开站点不再展示记忆文件清单；后台可看到文件数、版本数并输入密码解密。密文已随仓库 push，未授权方读到的只是 base64 噪声。
              </div>
              <MemoryVault />
            </div>
          </div>
        </section>
      </main>
    </AdminPageGate>
  )
}
