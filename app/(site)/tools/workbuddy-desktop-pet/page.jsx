import Image from 'next/image'

export const dynamic = 'force-static'

export const metadata = {
  title: '鹿鹿精灵｜长颈鹿桌宠与 WorkBuddy 本地助理入口',
  description: '鹿鹿精灵是一只陪你工作的长颈鹿桌宠。点击鹿鹿互动，主动发送文字给已授权的 WorkBuddy 本地助理，并在桌宠里查看回复。',
  alternates: { canonical: '/tools/workbuddy-desktop-pet' },
}

const steps = [
  ['01', '放在桌边', '桌宠悬浮在电脑桌面，可以拖动、置顶、点击互动。'],
  ['02', '主动发送', '在输入框输入文字并点击发送，已授权时交给 WorkBuddy 本地助理。'],
  ['03', '查看回复', '连接状态和本次助理回复在桌宠里显示；离线时保留明确标记的演示交互。'],
]

export default function DesktopPetPage() {
  return (
    <main className="min-h-screen bg-[#f7f2e9] px-5 py-16 text-[#263f39] dark:bg-[#132521] dark:text-[#f7edd8]">
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 inline-flex rounded-full border border-[#d7b88c] px-4 py-2 text-xs font-semibold tracking-widest text-[#815d34] dark:text-[#e4c399]">桌面应用 · 预览版</p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">鹿鹿精灵</h1>
            <p className="mt-6 text-xl leading-relaxed">一只住在桌面角落的长颈鹿，陪你把今天的事慢慢做好。</p>
            <p className="mt-5 leading-8 text-[#5b6c62] dark:text-[#c5d1c7]">摸摸鹿鹿，它会回应你。输入文字并主动发送后，已授权的 WorkBuddy 本地助理才会处理请求。没有连接时，鹿鹿也能陪你进行本地互动。</p>
            <div className="mt-8 rounded-2xl border border-[#d9d1bd] bg-white/70 p-5 text-sm leading-7 dark:border-[#51675d] dark:bg-white/5">
              <strong>当前进度</strong>：macOS / Windows Electron 原型已实现。WorkBuddy 真账号接入需要应用审核通过和用户授权；下载、付费与公开发行尚未开放。
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#213b35] p-7 shadow-2xl" aria-label="鹿鹿精灵形象示意">
            <div className="rounded-2xl bg-[#f6e9cd] px-4 py-3 text-sm text-[#35413c]">嗨，我是鹿鹿。今天想先做什么？</div>
            <div className="flex h-72 items-center justify-center" aria-hidden="true">
              <Image src="/images/workbuddy-desktop-pet/lulu-giraffe.png" alt="" width={280} height={280} className="h-64 w-64 object-contain drop-shadow-xl" priority />
            </div>
            <div className="rounded-xl bg-[#f4ebd9] p-4 text-sm text-[#35413c]"><span className="mr-2 text-[#54a58b]">●</span>鹿鹿在这里<div className="mt-3 rounded-lg bg-white px-4 py-3 text-[#8c9a91]">告诉鹿鹿，你想做什么… <span className="float-right">↑</span></div></div>
          </div>
        </div>
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
