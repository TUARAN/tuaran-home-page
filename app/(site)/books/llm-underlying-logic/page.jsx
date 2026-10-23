import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconBook2, IconExternalLink } from '@tabler/icons-react'

import PageContainer from '../../components/PageContainer'
import { PUBLISHED_WORKS } from '../../../../lib/site/publishedWorks'

const book = PUBLISHED_WORKS[0]
const isbn = '9787522648842'

export const metadata = {
  title: '《大模型的底层逻辑》｜涂阿燃著',
  description: '了解涂阿燃的《大模型的底层逻辑》：从模型原理、推理与幻觉，走向 RAG、知识库、MCP 与智能体。',
  openGraph: {
    title: '《大模型的底层逻辑》｜涂阿燃著',
    description: '看懂原理，理解边界，建立 AI 判断力。',
    images: [book.image],
  },
}

const topics = [
  { number: '01', title: '模型原理', detail: '从训练与生成过程出发，理解大模型为什么能处理语言和知识。' },
  { number: '02', title: '推理与幻觉', detail: '辨认模型能做出的推断，以及回答需要核验的地方。' },
  { number: '03', title: 'RAG 与知识库', detail: '了解外部资料如何进入回答过程，以及检索质量为什么重要。' },
  { number: '04', title: 'MCP 与智能体', detail: '认识模型连接工具、读取上下文和执行任务时的能力与边界。' },
]

const searchTerm = encodeURIComponent(`大模型的底层逻辑 ${isbn}`)
const stores = [
  { name: '京东', href: `https://search.jd.com/Search?keyword=${searchTerm}` },
  { name: '当当', href: `https://search.dangdang.com/?key=${searchTerm}` },
  { name: '淘宝', href: `https://s.taobao.com/search?q=${searchTerm}` },
]

export default function LlmUnderlyingLogicBookPage() {
  return (
    <PageContainer className="pb-20 pt-8 md:pt-12">
      <nav aria-label="当前位置" className="mb-6 text-[13px] text-[#766f64] dark:text-gray-400">
        <Link href="/" className="hover:underline">首页</Link><span className="mx-2" aria-hidden="true">/</span>
        <Link href="/publications" className="hover:underline">出版作品</Link><span className="mx-2" aria-hidden="true">/</span>
        <span className="text-[#342d25] dark:text-gray-200">大模型的底层逻辑</span>
      </nav>

      <section className="relative overflow-hidden rounded-[28px] border border-[#e5d8c6] bg-[#f7f1e8] shadow-[0_28px_80px_rgba(70,47,24,0.1)] dark:border-[#44362b] dark:bg-[#201b18]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full bg-[#ffd69d]/60 blur-[90px] dark:bg-[#a55a2a]/25" />
        <div className="relative grid gap-8 px-6 py-9 md:grid-cols-[minmax(0,1fr)_minmax(290px,42%)] md:items-center md:gap-12 md:px-12 md:py-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9ab77] bg-[#fff8ed] px-3 py-1.5 text-[12px] font-semibold tracking-[0.08em] text-[#8c471f] dark:border-[#875b38] dark:bg-[#3b2b20] dark:text-[#f6bf89]">
              <IconBook2 size={16} aria-hidden="true" /> 2026 · 技术图书 · 已出版
            </div>
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.23em] text-[#9b714e] dark:text-[#d7a071]">New publication</p>
            <h1 className="mb-5 font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[1.13] tracking-[0.02em] text-[#2c231d] dark:text-[#f9eee2]">大模型的<br />底层逻辑</h1>
            <p className="mb-6 text-[18px] font-medium leading-8 text-[#694d38] dark:text-[#e4b88f]">看懂原理，理解边界，建立 AI 判断力。</p>
            <p className="mb-7 max-w-[34rem] text-[15px] leading-8 text-[#5c554d] dark:text-[#d2c3b8]">{book.description}</p>
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#5c554d] dark:text-[#d2c3b8]"><span className="h-px w-8 bg-[#b67a4b]" />涂阿燃 著<span className="text-[#aa9b8c]" aria-hidden="true">·</span><span>ISBN {isbn}</span></div>
            <a href="#buy" className="inline-flex items-center gap-2 rounded-xl bg-[#a84c12] px-6 py-3.5 text-[15px] font-semibold text-white no-underline shadow-[0_10px_25px_rgba(168,76,18,0.22)] transition hover:-translate-y-0.5 hover:bg-[#8f3d0a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a84c12]">查看购书渠道 <IconArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <div className="mx-auto w-full max-w-[470px] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_25px_65px_rgba(68,44,22,0.2)] dark:border-[#5c4e45] dark:bg-[#2b2521]">
            <Image src={book.image} alt="《大模型的底层逻辑》图书封面，作者涂阿燃" width={1536} height={1536} sizes="(max-width: 768px) 100vw, 470px" className="h-auto w-full" priority />
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-labelledby="book-topics">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 font-mono text-[12px] uppercase tracking-[0.2em] text-[#ad693c] dark:text-[#e4a66c]">Inside the book</p><h2 id="book-topics" className="mb-0 font-serif text-[28px] font-semibold text-[#2c2924] dark:text-gray-100 md:text-[34px]">从模型原理走向实际应用</h2></div>
          <p className="mb-0 max-w-[29rem] text-[14px] leading-7 text-[#746f66] dark:text-gray-400">围绕这些核心议题，理解大模型的能力、局限与应用方式。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{topics.map((topic) => <article key={topic.number} className="rounded-2xl border border-[#e7e1d8] bg-white p-6 dark:border-[#30343a] dark:bg-[#151a20]"><span className="mb-4 block font-mono text-[13px] font-bold tracking-[0.15em] text-[#be7845]">{topic.number}</span><h3 className="mb-2 text-[19px] font-semibold text-[#302b25] dark:text-gray-100">{topic.title}</h3><p className="mb-0 text-[14px] leading-7 text-[#6c675f] dark:text-gray-400">{topic.detail}</p></article>)}</div>
      </section>

      <section id="buy" className="scroll-mt-28 rounded-[24px] border border-[#e0d2c1] bg-[#fffaf3] px-6 py-8 dark:border-[#46392e] dark:bg-[#201b18] md:px-10 md:py-10" aria-labelledby="buy-heading">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.2em] text-[#ad693c] dark:text-[#e4a66c]">Find the book</p>
        <h2 id="buy-heading" className="mb-3 font-serif text-[27px] font-semibold text-[#2c2924] dark:text-gray-100">购书渠道</h2>
        <p className="mb-6 max-w-[46rem] text-[14px] leading-7 text-[#6c675f] dark:text-gray-300">以下链接会在各平台搜索书名和 ISBN {isbn}。商品页尚未核实；下单前请核对书名、作者和书号。</p>
        <div className="grid gap-3 sm:grid-cols-3">{stores.map((store) => <a key={store.name} href={store.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-[#dfc5ac] bg-white px-5 py-4 text-[15px] font-semibold text-[#743e22] no-underline transition hover:-translate-y-0.5 hover:border-[#ae6e3e] hover:shadow-[0_10px_24px_rgba(112,65,26,0.1)] dark:border-[#654a36] dark:bg-[#2a2420] dark:text-[#ffd1a4]"><span>去{store.name}搜索</span><IconExternalLink size={18} className="transition group-hover:translate-x-0.5" aria-hidden="true" /></a>)}</div>
      </section>
    </PageContainer>
  )
}
