import Image from 'next/image'
import DesktopPetDemo from './DesktopPetDemo'

export const dynamic = 'force-static'

const pageUrl = 'https://2aran.com/tools/workbuddy-desktop-pet'
const title = '鹿鹿精灵｜长颈鹿桌宠与 WorkBuddy 本地助理入口'
const description = '鹿鹿精灵是一只陪你工作的长颈鹿桌宠。站内体验点击与文字互动，查看 Electron 桌面原型。'

export const metadata = {
  title,
  description,
  alternates: { canonical: '/tools/workbuddy-desktop-pet' },
  openGraph: { title, description, url: pageUrl, type: 'website' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: pageUrl,
  inLanguage: 'zh-CN',
}

const steps = [
  ['01', '放在桌边', '桌宠悬浮在电脑桌面，可以拖动、置顶、点击互动。'],
  ['02', '主动发送', '在输入框输入文字并点击发送，已授权时交给 WorkBuddy 本地助理。'],
  ['03', '查看回复', '连接状态和本次助理回复在桌宠里显示；离线时保留明确标记的演示交互。'],
]

export default function DesktopPetPage() {
  return (
    <main className="min-h-screen bg-[#f7f2e9] px-5 py-16 text-[#263f39] dark:bg-[#132521] dark:text-[#f7edd8]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 inline-flex rounded-full border border-[#d7b88c] px-4 py-2 text-xs font-semibold tracking-widest text-[#815d34] dark:text-[#e4c399]">桌面应用 · 预览版</p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">鹿鹿精灵</h1>
            <p className="mt-6 text-xl leading-relaxed">一只住在桌面角落的长颈鹿，陪你把今天的事慢慢做好。</p>
            <p className="mt-5 leading-8 text-[#5b6c62] dark:text-[#c5d1c7]">摸摸鹿鹿，它会回应你。网页演示只在浏览器里回应输入；桌面版在完成授权后，才会把你主动发送的文字交给 WorkBuddy 本地助理。</p>
            <div className="mt-8 rounded-2xl border border-[#d9d1bd] bg-white/70 p-5 text-sm leading-7 dark:border-[#51675d] dark:bg-white/5">
              <strong>当前进度</strong>：Electron 桌宠原型已实现，网页可体验摸摸鹿鹿与文字互动。桌面安装包尚未开放；WorkBuddy 真账号接入还需应用审核与用户授权。
            </div>
            <a href="https://github.com/TUARAN/tuaran-home-page/tree/main/tools/workbuddy-desktop-pet" target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full border border-[#263f39] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#263f39] hover:text-white dark:border-[#f7edd8] dark:hover:bg-[#f7edd8] dark:hover:text-[#263f39]">查看原型源码 ↗</a>
          </div>
          <DesktopPetDemo />
        </div>
        <figure className="mt-16 rounded-2xl border border-[#d9d1bd] bg-white/70 p-5 dark:border-[#51675d] dark:bg-white/5">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
            <figcaption>
              <h2 className="text-2xl font-semibold">桌面版实际界面</h2>
              <p className="mt-3 leading-8 text-[#5b6c62] dark:text-[#c5d1c7]">Electron 预览版可悬浮、拖动和置顶。网页演示只在当前浏览器回应点击与文字输入，不会访问本机桥接器。</p>
            </figcaption>
            <Image src="/images/workbuddy-desktop-pet/screenshot.png" alt="鹿鹿精灵 Electron 桌面窗口截图" width={732} height={996} className="mx-auto w-full max-w-[260px] rounded-xl" />
          </div>
        </figure>
        <section className="mt-24 grid gap-5 md:grid-cols-3" aria-label="使用方式">
          {steps.map(([number, title, detail]) => <article key={number} className="rounded-2xl border border-[#d9d1bd] p-6 dark:border-[#50635a]"><span className="text-sm font-semibold text-[#b17e45]">{number}</span><h2 className="mt-3 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 opacity-75">{detail}</p></article>)}
        </section>
        <section className="mt-12 rounded-2xl bg-[#eae1cf] p-6 leading-8 dark:bg-[#213b35]">
          <h2 className="text-xl font-semibold">授权与隐私</h2>
          <p className="mt-2">桌宠仅在用户点击发送后，将输入的文字交给本机桥接器；授权后由 WorkBuddy 本地助理处理。连接状态和该次回复用于在桌宠中展示。离线演示不会访问 WorkBuddy。桌宠进程不保存 Client Secret 或 OAuth token。用户可关闭桌宠和撤销 WorkBuddy 授权。</p>
          <p className="mt-3 text-sm opacity-75">产品仍在预览阶段，尚未提供公开账号服务、付费功能或自动任务。</p>
        </section>
      </div>
    </main>
  )
}
