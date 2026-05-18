import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于我',
  description:
    '涂阿燃（tuaran / 掘金安东尼）：前端 + AI Agent + 政企方案 + 创业 + 奶爸。把混乱编程为系统，把想法变成产品。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '掘金安东尼',
    '安东尼404',
    '关于我',
    '前端工程师',
    'AI Agent',
    '矩联科技',
    '博主联盟',
  ],
  alternates: { canonical: '/about' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const identitySegments = [
  { label: '前端', detail: '十年前端工程化与组件体系经验' },
  { label: 'AI Agent', detail: '智能体落地 / 工程化 / 大模型应用' },
  { label: '政企方案', detail: '数字员工 / 央国企信创落地' },
  { label: '创业', detail: '矩联科技 · 博主联盟 · 前端下一步' },
  { label: '奶爸', detail: '一个把家庭也工程化的父亲' },
]

const beliefs = [
  '长期主义 > 短期收割。选一件值得二十年的事，每日复利，高频迭代。',
  '工程的尽头是系统，系统的尽头是认知。先把混乱变成可复用结构。',
  '复合身份是稀缺性的源头。在多个领域之间架桥的人，比单点深耕者更值得被看见。',
  '内容是 IP 的根，社群是 IP 的护城河，产品是 IP 的变现接口。',
  '工具是手段，孩子是答案。技术解决了什么家庭问题，比解决了什么技术问题更重要。',
]

const channels = [
  { label: '掘金 · 219 万阅读 / 1.3 万粉', href: 'https://juejin.cn/user/1521379823340792' },
  { label: '小红书 · 100 万阅读', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e' },
  { label: 'CSDN · 15 万阅读', href: 'https://blog.csdn.net/aifs2025' },
  { label: '51CTO · 16 万阅读', href: 'https://blog.51cto.com/u_15298598' },
  { label: 'GitHub', href: 'https://github.com/TUARAN' },
  { label: '矩联科技', href: 'https://matrixlink.tech/' },
  { label: '博主联盟', href: 'https://blogger-alliance.cn/matrix' },
]

const stops = [
  { label: '上下文记忆', href: '/context-memory', desc: '写给智能体读取的 4 层个人记忆' },
  { label: '知识库', href: '/articles', desc: '精选文章 + 公司调研 + 事项调研' },
  { label: '对话', href: '/web-llm', desc: '在浏览器内用 WebGPU 跑大模型' },
  { label: '茉莉奶爸待办', href: '/xiaomoli-dad-todo', desc: '日常与家庭节奏的多维勾选' },
  { label: '请喝咖啡', href: '/donate', desc: '如果这里对你有帮助，欢迎支持' },
]

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-10 border-b border-[#e8dfd0] pb-8 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          About · 一句话讲清我是谁
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100 md:text-3xl">
          我是涂阿燃，<span className="text-[#666] dark:text-gray-400">tuaran / 掘金安东尼</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#5d554a] dark:text-gray-300">
          一个把<span className="font-semibold text-[#221f19] dark:text-gray-100">复合身份</span>
          当成稀缺性的人：前端工程化的老手、AI Agent 工程化的新兵、央国企政企方案的乙方、矩联科技的创始人、博主联盟的主理人，
          同时是一个一岁多女儿的爸爸。
        </p>
        <p className="mt-3 max-w-2xl text-[15px] leading-8 text-[#5d554a] dark:text-gray-300">
          这个站点是我的<span className="font-semibold text-[#221f19] dark:text-gray-100">真身</span>
          —— 比掘金/小红书/知乎/CSDN/51CTO 任何一个平台都更完整。
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-5 font-serif text-xl font-semibold text-[#221f19] dark:text-gray-100">五个身份</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {identitySegments.map((seg) => (
            <div
              key={seg.label}
              className="rounded-xl border border-[#e8dfd0] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
                /
              </div>
              <div className="mt-1 text-[18px] font-semibold text-[#221f19] dark:text-gray-100">{seg.label}</div>
              <p className="mt-2 text-[13px] leading-6 text-[#666] dark:text-gray-400">{seg.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 font-serif text-xl font-semibold text-[#221f19] dark:text-gray-100">五个信念</h2>
        <ul className="space-y-3">
          {beliefs.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-[#e8dfd0] bg-white p-4 text-[14px] leading-7 text-[#5d554a] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <span className="mt-1 font-mono text-[11px] text-[#b7791f] dark:text-[#e2bd75]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 font-serif text-xl font-semibold text-[#221f19] dark:text-gray-100">在哪里能找到我</h2>
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-[#ded6c8] bg-white px-3 py-1.5 text-[13px] text-[#5f5a4d] no-underline transition hover:border-[#9c8e72] hover:text-[#221f19] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500"
            >
              {c.label}
            </a>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-5 font-serif text-xl font-semibold text-[#221f19] dark:text-gray-100">下一步去哪里</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stops.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group block rounded-xl border border-[#e8dfd0] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#d7cbb7] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
            >
              <div className="text-[16px] font-semibold text-[#221f19] dark:text-gray-100">{s.label} →</div>
              <p className="mt-1 text-[13px] leading-6 text-[#666] dark:text-gray-400">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-[#e8dfd0] pt-6 text-center text-[13px] text-[#888] dark:border-gray-800 dark:text-gray-500">
        <p>欢迎加我微信 <span className="font-mono">atar24</span>，注明「从 tuaran.me 来」。</p>
      </footer>
    </main>
  )
}
