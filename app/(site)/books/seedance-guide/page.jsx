import Image from 'next/image'
import Link from 'next/link'

import PageContainer from '../../components/PageContainer'
import MoreBooks from '../MoreBooks'
import { PUBLISHED_WORKS } from '../../../../lib/site/publishedWorks'

const book = PUBLISHED_WORKS.find((work) => work.href === '/books/seedance-guide')

export const dynamic = 'force-static'

export const metadata = {
  alternates: { canonical: '/books/seedance-guide' },
  title: '《Seedance：电影级AI视频创作指南》｜涂智研著',
  description: book.description,
}

export default function SeedanceGuidePage() {
  return (
    <PageContainer className="pb-12 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Book', name: book.title, author: { '@type': 'Person', name: book.author }, url: `https://2aran.com${book.href}` }).replace(/</g, '\u003c') }} />
      <nav aria-label="当前位置" className="mb-6 text-sm text-gray-500"><Link href="/publications" className="hover:underline">出版作品</Link> / Seedance</nav>
      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_260px] md:p-10">
        <div>
          <p className="mb-3 text-sm text-slate-500">{book.year} · {book.type} · {book.status}</p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 dark:text-white">{book.title}</h1>
          <p className="mb-5 text-base text-slate-600 dark:text-slate-300">作者：{book.author}（笔名） · {book.publisher}</p>
          <p className="mb-6 max-w-2xl leading-8 text-slate-700 dark:text-slate-200">{book.description} 涵盖 Seedance、即梦 AI、豆包、剪映、可灵等工具的协同工作流。</p>
          <div className="flex flex-wrap gap-3">
            {book.purchaseUrls.map((href, index) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-slate-600">京东购买入口 {index + 1} ↗</a>)}
          </div>
        </div>
        <Image src={book.image} alt="《Seedance：电影级AI视频创作指南》图书封面" width={370} height={574} className="h-auto w-full max-w-[260px] rounded-xl shadow-lg" priority />
      </section>
      <MoreBooks currentHref={book.href} />
    </PageContainer>
  )
}
