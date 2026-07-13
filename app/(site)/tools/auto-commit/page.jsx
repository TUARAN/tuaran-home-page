import Link from 'next/link'

import AutoCommitTool from './AutoCommitTool'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AutoCommit｜GitHub 贡献图填充工具',
  description: '选择日期区间与提交强度，预览 GitHub 贡献图并将带历史时间戳的 commit 推送到指定仓库。Token 仅由浏览器直连 GitHub。',
  keywords: ['AutoCommit', 'GitHub', '贡献图', 'commit', '开发者工具'],
  alternates: { canonical: '/tools/auto-commit' },
}

export default function AutoCommitPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f7] px-4 py-9 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-7">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            <Link href="/tools" className="hover:text-slate-900 dark:hover:text-white">工具库</Link>
            <span>／</span>
            <span>开发者工作流</span>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AutoCommit</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                选择区间与强度，预览并填充你的 GitHub 贡献图。
              </p>
            </div>
            <a
              href="https://github.com/TUARAN/AutoCommitWeb"
              target="_blank"
              rel="noreferrer"
              className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              GitHub 源项目 ↗
            </a>
          </div>
        </header>

        <AutoCommitTool />
      </div>
    </main>
  )
}
