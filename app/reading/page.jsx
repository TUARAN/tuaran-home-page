import Link from 'next/link'
import Image from 'next/image'
import SettingsButton from '../components/SettingsButton'
import ReadingPyramid from '../components/ReadingPyramid'

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

const pyramidLevels = [
  {
    no: '1',
    slug: 'biography',
    centerTitle: '传记',
    leftTitle: '先看\n人物\n传记',
    rightTitle: '高手的\n通透\n人生',
    books: ['苏东坡', '曹操', '王阳明', '曾国藩', '张居正', '左宗棠', '杨绛', '乔布斯', '袁了凡', '袁隆平'],
  },
  {
    no: '2',
    slug: 'psychology',
    centerTitle: '心理学',
    leftTitle: '再看\n心理学',
    rightTitle: '轻松掌握\n各种复杂\n关系',
    books: ['津巴多普通心理学', '心理学与生活', '社会心理学', '自卑与超越', '自控力', '操纵心理学', '亲密关系', '当下的力量', '象与骑象人'],
  },
  {
    no: '3',
    slug: 'sociology',
    centerTitle: '社会学',
    leftTitle: '接着看\n社会学',
    rightTitle: '明规则，懂\n真相知社会\n深浅',
    books: ['毛选', '盐铁论', '乡土中国', '社会学概论', '商君书', '社会学的邀请', '中国社会各阶层分析', '社会分工论', '回归故里'],
  },
  {
    no: '4',
    slug: 'wealth',
    centerTitle: '财富',
    leftTitle: '可以看\n搞钱书了',
    rightTitle: '构建财富观\n提高搞钱认知',
    books: ['原则', '贫穷的本质', '纳瓦尔宝典', '韭菜的自我修养', '财富真相'],
  },
  {
    no: '5',
    slug: 'history',
    centerTitle: '历史',
    leftTitle: '接着研究\n历史\n不然你搞到钱也没用',
    rightTitle: '以史为鉴',
    books: ['典籍里的中国', '资治通鉴', '中国近代史', '中国通史', '历史的温度', '西南联大文学课'],
  },
  {
    no: '6',
    slug: 'philosophy',
    centerTitle: '哲学',
    leftTitle: '最后研究\n哲学',
    rightTitle: '多维看世界，\n格局拉满',
    books: ['中国哲学史', '苏菲的世界', '苏格拉底的申辩', '理想国', '世界哲学史', '你的第一本哲学书'],
  },
]

export default function ReadingIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
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

      <details open className="mb-8 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
        <summary className="px-4 py-3 text-xs text-[#888] dark:text-gray-400 cursor-pointer select-none">
          推荐阅读路径
        </summary>
        <div className="px-4 pb-3">
          <div className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4">
            <div className="text-center font-black text-2xl sm:text-3xl tracking-wide text-[#333] dark:text-gray-100">
              构建世界观的阅读顺序
            </div>

            <div className="mt-4 mx-auto max-w-3xl">
              <ReadingPyramid levels={pyramidLevels} />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#666] dark:text-gray-300">
              {pyramidLevels.map((lv) => (
                <div
                  key={`books-${lv.no}`}
                  className="border border-[#eee] dark:border-gray-800 bg-[#fafafa] dark:bg-gray-800/50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium text-white bg-[#555] dark:bg-gray-600 rounded-full flex-shrink-0">
                      {lv.no}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#333] dark:text-gray-200">
                        {lv.leftTitle.replace(/\n/g, ' / ')}
                      </div>
                      <div className="mt-1 leading-relaxed">
                        {lv.books.map((b) => `《${b}》`).join(' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

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
