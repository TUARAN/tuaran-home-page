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

const weeklyPosts = [
  {
    title: '2026年第6周｜写给自己的周报',
    week: '2026年第6周',
    date: '2026-02-05',
    sections: [
      {
        title: '生活',
        paragraphs: [
          '这一周，生活最大的感受仍然是带娃难。上周周一请假一天，这周周二又请了一上午。',
          '连续3天宝宝都在夜晚醒，醒了不睡，不同程度的闹到1-2小时；宝宝妈妈也几度崩溃。',
          '宝宝鼻子堵、又还有点咳嗽，天呐，怎么这么难啊。',
        ],
      },
      {
        title: '感悟',
        paragraphs: [
          '上班的时候，在摄像头看到宝宝哭、宝妈哭，真的很绝望。',
          '不知道这个班上的还有什么意义？钱也没赚到，仍然维持“整体体系在空转”的观点不变。',
        ],
      },
    ],
  },
]

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
          <div className="mt-4 space-y-6">
            {weeklyPosts.map((post) => (
              <article
                key={post.title}
                className="rounded-lg border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold text-[#111] dark:text-gray-100">
                    {post.title}
                  </h3>
                  <span className="text-xs text-[#999] dark:text-gray-400">
                    {post.week} · {post.date}
                  </span>
                </div>
                <div className="mt-4 space-y-4 text-sm text-[#666] dark:text-gray-300">
                  {post.sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#222] dark:text-gray-200">
                        {section.title}
                      </h4>
                      {section.paragraphs.map((text, index) => (
                        <p key={`${section.title}-${index}`} className="m-0">
                          {text}
                        </p>
                      ))}
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
