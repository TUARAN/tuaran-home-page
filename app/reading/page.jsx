import Link from 'next/link'
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
    leftTitle: '接着研究\n历史',
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

      <div className="mb-8 border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4">
        <div className="text-center font-black text-2xl sm:text-3xl tracking-wide text-[#333] dark:text-gray-100">
          构建世界观的阅读顺序
        </div>

        <div className="mt-4 mx-auto max-w-3xl">
          <ReadingPyramid levels={pyramidLevels} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#666] dark:text-gray-300">
          {pyramidLevels.map((lv) => (
            <Link
              key={`books-${lv.no}`}
              href={`/reading/${lv.slug}`}
              className="group border border-[#eee] dark:border-gray-800 bg-[#fafafa] dark:bg-gray-800/50 p-3 no-underline hover:no-underline hover:bg-white dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#999]/40"
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
