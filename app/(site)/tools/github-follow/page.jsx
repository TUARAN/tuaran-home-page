import Link from 'next/link'

import GitHubFollowTool from './GitHubFollowTool'

export const dynamic = 'force-static'

export const metadata = {
  title: 'GitHub 批量关注工具',
  description: '粘贴 GitHub 用户名或读取仓库贡献者，逐项确认后批量关注。Token 仅保存在当前浏览器内存。',
  keywords: ['GitHub', '批量关注', '开发者', '开源社区'],
  alternates: { canonical: '/tools/github-follow' },
}

export default function GitHubFollowPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] px-4 py-9 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-7">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            <Link href="/tools" className="hover:text-slate-900 dark:hover:text-white">工具库</Link>
            <span>／</span><span>GitHub 工作流</span>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">GitHub 批量关注</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                从用户名清单或仓库贡献者生成候选，检查资料后由你确认执行。
              </p>
            </div>
            <a href="https://github.com/TUARAN/github-auto-follow" target="_blank" rel="noreferrer" className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              GitHub 源项目 ↗
            </a>
          </div>
        </header>
        <GitHubFollowTool />
      </div>
    </main>
  )
}
