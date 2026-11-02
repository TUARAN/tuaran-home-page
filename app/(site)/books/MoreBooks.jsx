import Image from 'next/image'
import Link from 'next/link'
import { PUBLISHED_WORKS } from '../../../lib/site/publishedWorks'

export default function MoreBooks({ currentHref }) {
  return <section className="mt-8 border-t border-[#e7e1d8] pt-6 dark:border-[#30343a]" aria-labelledby="more-books-title">
    <h2 id="more-books-title" className="mb-4 font-serif text-[27px] font-semibold">其他著作</h2>
    <div className="grid gap-4 md:grid-cols-2">
      {PUBLISHED_WORKS.filter(book => book.href !== currentHref).map(book => <Link key={book.href} href={book.href} className="group flex gap-4 rounded-2xl border border-[#e7e1d8] bg-white p-4 no-underline transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 dark:border-[#30343a] dark:bg-[#151a20]">
        <Image src={book.image} alt={`${book.title}封面`} width={100} height={140} sizes="100px" className="h-28 w-20 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0"><p className="mb-2 text-xs text-[#746f66] dark:text-gray-400">{book.year} · {book.publisher} · {book.status}</p><h3 className="mb-2 text-lg font-bold text-[#302b25] dark:text-gray-100">{book.title}</h3><p className="mb-3 text-sm leading-6 text-[#6c675f] dark:text-gray-400">{book.description}</p><span className="text-sm font-semibold text-[#8c471f] dark:text-[#f6bf89]">查看图书详情 →</span></div>
      </Link>)}
    </div>
  </section>
}
