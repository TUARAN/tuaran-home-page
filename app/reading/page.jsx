import Link from 'next/link'
import Image from 'next/image'
import SettingsButton from '../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书',
  description: '涂阿燃（tuaran）的读书笔记与整理：按主题沉淀可复用的阅读框架。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '阅读记录', '读无用书', '网络日志'],
  alternates: {
    canonical: '/reading',
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

const categories = [
  {
    slug: 'biography',
    title: '传记',
    description: '人物与时代：用时间线理解选择与命运。',
    order: 1,
    reason: '从具体的人物故事开始，最容易代入和理解'
  },
  {
    slug: 'psychology',
    title: '心理学',
    description: '认知与行为：理解自己与他人的决策机制。',
    order: 2,
    reason: '理解个体的思维模式和行为动机'
  },
  {
    slug: 'sociology',
    title: '社会学',
    description: '关系与制度：个体、群体与系统如何运作。',
    order: 3,
    reason: '从个体扩展到群体，理解社会结构'
  },
  {
    slug: 'wealth',
    title: '财富',
    description: '商业与资产：复利、风险与配置的常识。',
    order: 4,
    reason: '掌握经济规律，理解资源配置'
  },
  {
    slug: 'history',
    title: '历史',
    description: '以史为镜：结构、周期与长期变量。',
    order: 5,
    reason: '在时间维度上验证前面的认知'
  },
  {
    slug: 'philosophy',
    title: '哲学',
    description: '概念与方法：用更清晰的框架看世界。',
    order: 6,
    reason: '最后抽象思考，建立自己的认知体系'
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

      <section className="mb-8 px-4 py-3 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
        <div className="text-xs text-[#888] dark:text-gray-400 mb-3">
          推荐阅读路径
        </div>
        <div className="flex items-start justify-between gap-1">
          {categories.map((c, idx) => (
            <div key={c.slug} className="flex items-start" style={{ flex: '1 1 0' }}>
              <div className="flex flex-col items-center text-center w-full">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium text-white bg-[#555] dark:bg-gray-600 rounded-full flex-shrink-0">
                    {c.order}
                  </span>
                  <span className="text-xs font-medium text-[#333] dark:text-gray-200 whitespace-nowrap">
                    {c.title}
                  </span>
                </div>
                <div className="text-[10px] text-[#666] dark:text-gray-400 leading-relaxed px-1">
                  {c.reason}
                </div>
              </div>
              {idx < categories.length - 1 && (
                <span className="text-[#ccc] dark:text-gray-600 text-xs mx-0.5 mt-1 flex-shrink-0">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-sm text-[#666] dark:text-gray-300">
          主题导航：
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/reading/${c.slug}`}
              className="group border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all overflow-hidden"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={`/reading/${c.slug}.png`}
                  alt={c.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
              <div className="px-3 py-3 border-t border-[#eee] dark:border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#444] dark:bg-gray-600 rounded-full">
                    {c.order}
                  </span>
                  <div className="text-sm font-medium text-[#444] dark:text-gray-200">
                    {c.title}
                  </div>
                </div>
                <div className="text-xs text-[#666] dark:text-gray-400">
                  {c.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
