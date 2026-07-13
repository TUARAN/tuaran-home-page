import Link from 'next/link'

import MultiIpTool from './MultiIpTool'

export const dynamic = 'force-static'

export const metadata = {
  title: '多出口 IP 检测与代理池配置器',
  description: '检测浏览器公网 IP 与 Cloudflare 边缘出口 IP，整理和导出 HTTP/SOCKS 代理池；完整代理轮换需配合本地 Node 或 VPS 后端。',
  keywords: ['IP 检测', '代理池', 'HTTP 代理', 'SOCKS5', 'Cloudflare', '网络工具'],
  alternates: { canonical: '/tools/multi-ip' },
}

export default function MultiIpPage() {
  return (
    <main className="min-h-screen bg-[#edf2f5] px-4 py-8 text-[#17212d] dark:bg-[#0c1218] dark:text-gray-100">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 rounded-xl border border-[#d5dfe7] border-t-4 border-t-[#0b7668] bg-white p-5 shadow-sm dark:border-[#26323d] dark:border-t-emerald-600 dark:bg-[#111a22]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#73808d]">
                <Link href="/tools" className="hover:text-[#0b7668]">工具库</Link><span>／</span><span>网络诊断</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">多出口 IP 工具</h1>
              <p className="mt-2 text-sm text-[#667085] dark:text-gray-400">公网出口检测、Cloudflare 边缘对照与本地代理池配置。</p>
            </div>
            <a href="https://github.com/TUARAN/blogger-eye-platform" target="_blank" rel="noreferrer" className="self-start rounded-md border border-[#d5dfe7] px-3 py-2 text-xs font-semibold text-[#526170] transition hover:border-[#0b7668] hover:text-[#0b7668] dark:border-gray-700 dark:text-gray-300">
              GitHub 源项目 ↗
            </a>
          </div>
        </header>

        <MultiIpTool />
      </div>
    </main>
  )
}
