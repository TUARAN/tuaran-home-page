import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 传记',
  description: '涂阿燃（tuaran）的读书笔记：传记类书籍的阅读记录与整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '传记', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/biography',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BiographyReadingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">读无用书 · 传记</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">这里会整理传记类书籍的读书笔记。</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/reading" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回读书
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="border border-[#eee] bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="m-0 text-sm text-[#666] dark:text-gray-300">
          传记类书籍的读书笔记整理中，敬请期待。
        </p>
        <p className="mt-3 mb-0 text-sm text-[#666] dark:text-gray-300">
          原先放在这里的人物调研（苏轼、人工智能先驱）已迁移到
          <Link
            href="/articles?tab=people"
            className="mx-1 underline underline-offset-4 opacity-90 hover:opacity-100"
          >
            知识库 · 人物调研
          </Link>
          。
        </p>
      </section>
    </div>
  )
}
