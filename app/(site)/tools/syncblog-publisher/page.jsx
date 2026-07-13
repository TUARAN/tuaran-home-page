import Link from 'next/link'

export const dynamic = 'force-static'

const platforms = ['微信公众号', '知乎', '掘金', 'CSDN', '小红书长文', '今日头条', 'B 站专栏', '博客园', 'Medium', 'X Articles']

export const metadata = {
  title: 'Syncblog 同步助手｜浏览器扩展',
  description: 'AI 分发大师配套浏览器扩展，一次编辑，将内容同步到多个内容平台。',
  keywords: ['Syncblog', 'COSE', '浏览器扩展', '内容分发'],
  alternates: { canonical: '/tools/syncblog-publisher' },
}

export default function SyncblogPublisherPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 text-slate-900 dark:text-slate-100">
      <div className="text-xs text-slate-500"><Link href="/tools" className="hover:underline">工具库</Link>　/　浏览器扩展</div>
      <header className="mt-5 rounded-3xl bg-slate-950 p-7 text-white sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">Create once · Sync everywhere</p><h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Syncblog 同步助手</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">AI 分发大师的配套发布扩展。利用已经登录的平台会话，把编辑好的内容同步到多个内容平台，扩展本身在本地浏览器运行。</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://github.com/TUARAN/cose/releases/latest" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950">下载最新版 ↗</a><a href="https://syncblog.cn" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">打开 AI 分发大师 ↗</a></div></header>
      <section className="grid gap-4 py-8 sm:grid-cols-3">{[['本地运行', '不收集、不存储用户的平台账号信息。'], ['多平台分发', '编辑一次，根据各平台格式生成并保存草稿。'], ['上游兼容', '基于 doocs/cose，平台同步逻辑持续跟随上游。']].map(([title, body]) => <div key={title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>)}</section>
      <section className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800"><h2 className="text-xl font-semibold">部分支持平台</h2><div className="mt-4 flex flex-wrap gap-2">{platforms.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs dark:bg-slate-800">{item}</span>)}</div><ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300"><li>从 GitHub Releases 下载并解压扩展。</li><li>在 Chrome 扩展管理页开启开发者模式，加载已解压目录。</li><li>打开 Syncblog，编辑内容并选择需要同步的平台。</li><li>执行前检查平台登录状态，发布结果仍由用户确认。</li></ol></section>
      <p className="mt-6 text-xs leading-5 text-slate-500">本项目是 doocs/cose 的下游 fork。通用版本、问题反馈和平台适配贡献请同时参考 <a href="https://github.com/doocs/cose" target="_blank" rel="noreferrer" className="underline">上游仓库</a>。</p>
    </main>
  )
}
