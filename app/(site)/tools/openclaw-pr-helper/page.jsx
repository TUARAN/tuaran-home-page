import Link from 'next/link'

export const dynamic = 'force-static'

const commands = [
  ['扫描候选', 'bin/openclaw-pr-tool scan'],
  ['生成 PR Body', 'bin/openclaw-pr-tool body --issue 123 …'],
  ['安全预演', 'bin/openclaw-pr-tool submit --body state/pr_body_issue_123.md …'],
  ['确认提交', '在完整 submit 命令末尾添加 --execute'],
]

export const metadata = {
  title: 'OpenClaw Issue PR Helper',
  description: '筛选低风险 OpenClaw Issue、生成真实验证证据，并以 dry-run 优先的方式创建贡献 PR。',
  keywords: ['OpenClaw', 'GitHub Issue', 'Pull Request', '开源贡献'],
  alternates: { canonical: '/tools/openclaw-pr-helper' },
}

export default function OpenClawPrHelperPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 text-slate-900 dark:text-slate-100">
      <div className="text-xs text-slate-500"><Link href="/tools" className="hover:underline">工具库</Link>　/　开发者工作流</div>
      <header className="mt-6 border-b border-slate-200 pb-8 dark:border-slate-800"><p className="font-mono text-xs uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Local CLI · Dry-run first</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">OpenClaw Issue PR Helper</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">本地扫描低风险 Issue，生成符合项目贡献要求的六字段 PR 说明，并调用官方提交脚本、GitHub CLI 完成贡献流程。它依赖本地 checkout 与登录状态，因此这里只提供安装和使用入口，不在公网代替用户执行。</p><a href="https://github.com/TUARAN/openclaw-issue-pr-tool" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">查看源码与安装说明 ↗</a></header>
      <section className="grid gap-4 py-8 sm:grid-cols-2">{commands.map(([title, command]) => <div key={title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><h2 className="text-sm font-semibold">{title}</h2><code className="mt-3 block overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200">{command}</code></div>)}</section>
      <section className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800"><h2 className="text-xl font-semibold">工作流边界</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><li>优先 documentation、good first issue、help wanted 等低风险候选。</li><li>跳过安全、鉴权、支付、密钥、许可证、数据库迁移和大重构。</li><li>默认只 dry-run；只有显式添加 <code>--execute</code> 才会提交、推送和创建 PR。</li><li>PR Body 固定记录行为、真实环境、验证命令、证据、观察结果和未测试范围。</li></ul></section>
      <aside className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">需要 Python 3.9+、已登录的 GitHub CLI，以及本地 OpenClaw checkout。不要把 GitHub Token、日志或本地状态文件上传到网页。</aside>
    </main>
  )
}
