import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconExternalLink } from '@tabler/icons-react'

import PageContainer from '../../components/PageContainer'
import MoreBooks from '../MoreBooks'
import SignatureEditionCard from '../SignatureEditionCard'
import { PUBLISHED_WORKS } from '../../../../lib/site/publishedWorks'

const book = PUBLISHED_WORKS.find((work) => work.href === '/books/seedance-guide')

const aboutDetail =
  '涵盖 Seedance、即梦 AI、豆包、剪映、可灵等工具的协同工作流。'

export const dynamic = 'force-static'

export const metadata = {
  alternates: { canonical: '/books/seedance-guide' },
  title: '《Seedance：电影级AI视频创作指南》｜涂阿燃（笔名：涂智岩）、李谊林联合编著',
  description: book.description,
  openGraph: {
    url: 'https://2aran.com/books/seedance-guide',
    title: '《Seedance：电影级AI视频创作指南》｜涂阿燃、李谊林联合编著',
    description: book.description,
    images: [book.image],
  },
}

export default function SeedanceGuidePage() {
  return (
    <PageContainer className="pb-12 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Book', name: book.title, author: [{ '@type': 'Person', name: '涂阿燃', alternateName: '涂智岩' }, { '@type': 'Person', name: '李谊林' }], url: `https://2aran.com${book.href}` }).replace(/</g, '\u003c') }} />
      <nav aria-label="当前位置" className="mb-6 text-sm text-gray-500"><Link href="/resources/books" className="hover:underline">图书馆</Link> / Seedance</nav>
      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_260px] md:p-10">
        <div>
          <p className="mb-3 text-sm text-slate-500">{book.year} · {book.type} · {book.status}</p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 dark:text-white">{book.title}</h1>
          <p className="mb-5 text-base text-slate-600 dark:text-slate-300">{book.author} {book.authorship} · {book.publisher}</p>
          <p className="mb-6 max-w-2xl text-[15px] leading-8 text-slate-700 dark:text-slate-200">{book.description}</p>
          <a href="#buy" className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800">
            查看购书渠道 <IconArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
        <Image src={book.image} alt="《Seedance：电影级AI视频创作指南》图书封面" width={370} height={574} className="h-auto w-full max-w-[260px] rounded-xl shadow-lg" priority />
      </section>

      <section id="buy" className="scroll-mt-28 mt-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 dark:border-slate-700 dark:bg-slate-900 md:px-7 md:py-6" aria-labelledby="buy-heading">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Find the book</p>
        <h2 id="buy-heading" className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">购书渠道</h2>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">通过京东购买链接下单，具体上架与库存以平台结果为准。下单前请核对书名与作者信息。</p>
        <div className="mb-5">
          <SignatureEditionCard slug="seedance-guide" title="Seedance：电影级AI视频创作指南" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {book.purchaseUrls.map((href, index) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-semibold text-slate-800 no-underline transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <span>京东购买入口 {index + 1}</span>
              <IconExternalLink size={18} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-700" aria-labelledby="book-about">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Inside the book</p>
        <h2 id="book-about" className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">从创意到成片</h2>
        <p className="mb-0 max-w-2xl text-[15px] leading-8 text-slate-700 dark:text-slate-200">
          {book.description} {aboutDetail}
        </p>
      </section>

      <MoreBooks currentHref={book.href} />
    </PageContainer>
  )
}