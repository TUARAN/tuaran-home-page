import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'

export const dynamic = 'force-static'

const pdfHref = '/resources/tapeout-protocol/TapeOut-Protocol.pdf'
const title = 'TapeOut Protocol｜在 BNB Chain 上设计链上电路'
const description = 'TapeOut Protocol 资源介绍：从 NAND、LATCH 到处理器画布与链上流片，并附 5 页中文宣言 PDF。'

export const metadata = {
  title,
  description,
  keywords: ['TapeOut Protocol', 'BNB Chain', '链上电路', 'NAND', 'LATCH', '流片', '链上处理器'],
  alternates: { canonical: '/resources/tapeout-protocol' },
  openGraph: { type: 'article', title, description, url: 'https://2aran.com/resources/tapeout-protocol', locale: 'zh_CN' },
}

const steps = [
  { number: '01', title: '搭元件', detail: 'NAND（与非门）负责布尔逻辑；LATCH（触发器）保存一位状态。两者可以组合成有记忆的电路。' },
  { number: '02', title: '在画布连线', detail: '先在浏览器里拖放元件、连接输入与输出并测试，也可以复用已有电路作为更大的模块。' },
  { number: '03', title: '提交“流片”', detail: '按宣言描述，提交设计时消耗对应元件 Token，把电路逻辑写入链上，形成可供查询的电路 NFT。' },
]

export default function TapeOutProtocolPage() {
  return (
    <PageContainer width="standard" className="py-8 md:py-12">
      <ContentPvBeacon category="resource" slug="tapeout-protocol" />
      <article className="mx-auto max-w-5xl text-slate-900 dark:text-slate-100">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#f2f8f5,#e9f1f1_52%,#f7f4eb)] p-6 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#10231d,#15242a_52%,#26241b)] md:p-10">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Link href="/articles?group=resource" className="hover:underline">资源库</Link>
            <span>／</span><span>链上协议</span>
          </div>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">NAND · LATCH · TAPE OUT</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">TapeOut Protocol</h1>
          <p className="mt-4 text-xl text-slate-700 dark:text-slate-200">把逻辑门连成可以调用的链上电路</p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300 md:text-base">
            TapeOut 尝试把处理器的基本逻辑搬到 BNB Chain：用与非门搭建运算，用触发器保存状态，在画布中设计电路，再把设计提交到链上。想理解它，先从一条电路如何产生和调用开始。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={pdfHref} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">阅读中文宣言 PDF ↗</a>
            <Link href="/tapeout-xiangqi" className="rounded-xl border border-emerald-600 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-950">试玩中国象棋上链原型 →</Link>
            <a href="https://tapeout.net/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-400 px-5 py-3 text-sm font-medium hover:bg-white/60 dark:border-slate-500 dark:hover:bg-white/10">前往 TapeOut 官网 ↗</a>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-semibold">一条电路怎样产生</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <span className="font-mono text-sm text-emerald-700 dark:text-emerald-300">{step.number}</span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="text-xl font-semibold">它想解决什么</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">电路可以像函数一样接收输入、返回结果；完成的电路还可以成为新设计的组成部分。宣言进一步提出用这些电路拼成链上处理器，并将名为 Behemoth（巨兽）的四位处理器作为示例。</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">阅读时注意</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">附录是 TapeOut 的项目宣言，包含“永久运行”“安全调用”、出块间隔与处理器实现状态等项目方表述；这里不将其视为独立审计结论。合约权限、网络参数及实际使用成本可能变化，交互前请以官网和链上记录核对。</p>
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
          <h2 className="text-2xl font-semibold">原始资料</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">《TapeOut 链上微处理器宣言》，署名 TapeOut / @Blonskr，5 页中文 PDF。内容涵盖与非门、触发器、处理器创建、画布流片、电路调用及 Behemoth。文件保留原样，方便对照项目方表述。</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={pdfHref} download="TapeOut-Protocol.pdf" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">下载原版 PDF（约 187 KB）↓</a>
            <a href="https://tapeout.net/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">查看官网最新信息 ↗</a>
          </div>
        </section>
      </article>
    </PageContainer>
  )
}
