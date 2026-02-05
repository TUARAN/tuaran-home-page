import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '周报 · TUARAN ｜ 涂阿燃 Weekly',
  description:
    '写给自己的每周周报，记录生活、技术学习、综合学习、感悟与工作小结。',
  keywords: ['涂阿燃', 'tuaran', '周报', 'weekly', '生活记录', '工作小结'],
  alternates: {
    canonical: '/weekly',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

const columns = [
  {
    title: '生活',
    description: '记录一周的日常、家庭、运动与微小的改变。',
  },
  {
    title: '技术学习',
    description: '总结本周技术输入与输出，沉淀可复用的知识点。',
  },
  {
    title: '综合学习',
    description: '跨学科阅读与知识联结，建立更完整的认知网络。',
  },
  {
    title: '感悟',
    description: '阶段性反思与思考，用文字校准方向。',
  },
  {
    title: '工作小结',
    description: '本周交付、协作与改进点，为下一周留痕。',
  },
]

const weeklyPosts = []

export default function WeeklyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="border-b border-[#eee] pb-6 mb-8 dark:border-gray-800">
        <p className="text-xs uppercase tracking-widest text-[#999]">
          Weekly Review
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111] dark:text-white">
          周报 · 涂阿燃 ｜ TUARAN WEEKLY
        </h1>
        <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
          每周都要为工作写周报，但更重要的是写给自己。这是一个长期记录：
          生活、技术学习、综合学习、感悟与工作小结。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-[#004276] dark:text-blue-400 underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            返回首页
          </Link>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold">专栏方向</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {columns.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[#eee] bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="text-base font-semibold text-[#111] dark:text-gray-100">
                {item.title}
              </h3>
              <p className="mt-2 text-[#666] dark:text-gray-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">最新周报</h2>
        {weeklyPosts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#ddd] p-6 text-sm text-[#888] dark:border-gray-700 dark:text-gray-400">
            还没有发布周报。先立个 flag：每周更新一篇。
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {weeklyPosts.map((post) => (
              <li key={post.href}>
                <Link
                  href={post.href}
                  className="text-sm text-[#004276] dark:text-blue-400 underline underline-offset-4 opacity-80 hover:opacity-100"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
