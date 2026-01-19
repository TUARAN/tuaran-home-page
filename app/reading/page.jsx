import Link from 'next/link'
import SettingsButton from '../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书',
  description: '涂阿燃（tuaran）的读书笔记与整理：按主题沉淀可复用的阅读框架。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '阅读记录', '读无用书', '网络日志'],
  alternates: {
    canonical: '/reading',
  },
}

const categories = [
  {
    slug: 'biography',
    title: '传记',
    description: '人物与时代：用时间线理解选择与命运。',
  },
  {
    slug: 'history',
    title: '历史',
    description: '以史为镜：结构、周期与长期变量。',
  },
  {
    slug: 'philosophy',
    title: '哲学',
    description: '概念与方法：用更清晰的框架看世界。',
  },
  {
    slug: 'psychology',
    title: '心理学',
    description: '认知与行为：理解自己与他人的决策机制。',
  },
  {
    slug: 'sociology',
    title: '社会学',
    description: '关系与制度：个体、群体与系统如何运作。',
  },
  {
    slug: 'wealth',
    title: '财富',
    description: '商业与资产：复利、风险与配置的常识。',
  },
]

export default function ReadingIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">读无用书</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              不为功利，只求心静自满。入口收敛为少数主类，其余内容沉到栏目页内。
            </p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <section className="space-y-4">
        <div className="text-sm text-[#666] dark:text-gray-300">
          主题导航：
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/reading/${c.slug}`}
              className="border border-[#eee] bg-white px-3 py-2 text-center text-sm text-[#444] dark:text-gray-200 dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
