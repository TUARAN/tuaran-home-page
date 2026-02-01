import Link from 'next/link'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 哲学',
  description: '涂阿燃（tuaran）的读书笔记：哲学类阅读记录与整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '哲学', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/philosophy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PhilosophyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">读无用书 · 哲学</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">这里会整理哲学类的阅读记录。</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/reading" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回读书
              </Link>
            </div>
          </div>
          <SettingsButton />
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden md:block md:w-52 shrink-0">
          <nav className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-6">
            <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
              目录
            </div>
            <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              <li>
                <a
                  href="#schools"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  哲学派系
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="schools" className="text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              哲学派系
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <th className="text-left text-xs font-bold text-[#444] dark:text-gray-200 py-2 pr-4">派系</th>
                    <th className="text-left text-xs font-bold text-[#444] dark:text-gray-200 py-2 pr-4">核心问题</th>
                    <th className="text-left text-xs font-bold text-[#444] dark:text-gray-200 py-2 pr-4">代表哲学家</th>
                    <th className="text-left text-xs font-bold text-[#444] dark:text-gray-200 py-2 pr-4">代表书籍</th>
                    <th className="text-left text-xs font-bold text-[#444] dark:text-gray-200 py-2">一句话定位</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#666] dark:text-gray-300">
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">前苏格拉底</td>
                    <td className="py-3 pr-4">世界的本原是什么</td>
                    <td className="py-3 pr-4 whitespace-nowrap">赫拉克利特</td>
                    <td className="py-3 pr-4 whitespace-nowrap">《论自然》</td>
                    <td className="py-3">万物流变</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">古希腊哲学</td>
                    <td className="py-3 pr-4">真理、德性、城邦</td>
                    <td className="py-3 pr-4 whitespace-nowrap">柏拉图</td>
                    <td className="py-3 pr-4 whitespace-nowrap">理想国</td>
                    <td className="py-3">正义与理想社会</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">古希腊哲学</td>
                    <td className="py-3 pr-4">逻辑、存在、分类</td>
                    <td className="py-3 pr-4 whitespace-nowrap">亚里士多德</td>
                    <td className="py-3 pr-4 whitespace-nowrap">形而上学</td>
                    <td className="py-3">西方理性地基</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">儒家哲学</td>
                    <td className="py-3 pr-4">伦理、秩序、角色</td>
                    <td className="py-3 pr-4 whitespace-nowrap">孔子</td>
                    <td className="py-3 pr-4 whitespace-nowrap">论语</td>
                    <td className="py-3">人伦社会设计</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">儒家哲学</td>
                    <td className="py-3 pr-4">人性与政治</td>
                    <td className="py-3 pr-4 whitespace-nowrap">孟子</td>
                    <td className="py-3 pr-4 whitespace-nowrap">孟子</td>
                    <td className="py-3">性善论</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">道家哲学</td>
                    <td className="py-3 pr-4">自然、自由、反控制</td>
                    <td className="py-3 pr-4 whitespace-nowrap">老子</td>
                    <td className="py-3 pr-4 whitespace-nowrap">道德经</td>
                    <td className="py-3">无为而治</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">道家哲学</td>
                    <td className="py-3 pr-4">个体自由</td>
                    <td className="py-3 pr-4 whitespace-nowrap">庄子</td>
                    <td className="py-3 pr-4 whitespace-nowrap">庄子</td>
                    <td className="py-3">精神解放</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">佛学哲学</td>
                    <td className="py-3 pr-4">苦、空、无常</td>
                    <td className="py-3 pr-4 whitespace-nowrap">龙树</td>
                    <td className="py-3 pr-4 whitespace-nowrap">中论</td>
                    <td className="py-3">破一切执</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">经院哲学</td>
                    <td className="py-3 pr-4">信仰与理性</td>
                    <td className="py-3 pr-4 whitespace-nowrap">托马斯·阿奎那</td>
                    <td className="py-3 pr-4 whitespace-nowrap">神学大全</td>
                    <td className="py-3">理性为信仰服务</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">理性主义</td>
                    <td className="py-3 pr-4">理性是否可靠</td>
                    <td className="py-3 pr-4 whitespace-nowrap">笛卡尔</td>
                    <td className="py-3 pr-4 whitespace-nowrap">第一哲学沉思集</td>
                    <td className="py-3">我思故我在</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">经验主义</td>
                    <td className="py-3 pr-4">知识从何而来</td>
                    <td className="py-3 pr-4 whitespace-nowrap">休谟</td>
                    <td className="py-3 pr-4 whitespace-nowrap">人类理解研究</td>
                    <td className="py-3">因果是习惯</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">批判哲学</td>
                    <td className="py-3 pr-4">理性边界</td>
                    <td className="py-3 pr-4 whitespace-nowrap">康德</td>
                    <td className="py-3 pr-4 whitespace-nowrap">纯粹理性批判</td>
                    <td className="py-3">认知的天花板</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">德国观念论</td>
                    <td className="py-3 pr-4">精神与历史</td>
                    <td className="py-3 pr-4 whitespace-nowrap">黑格尔</td>
                    <td className="py-3 pr-4 whitespace-nowrap">精神现象学</td>
                    <td className="py-3">世界是展开的理性</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">功利主义</td>
                    <td className="py-3 pr-4">如何计算幸福</td>
                    <td className="py-3 pr-4 whitespace-nowrap">边沁、密尔</td>
                    <td className="py-3 pr-4 whitespace-nowrap">功利主义</td>
                    <td className="py-3">最大多数幸福</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">马克思主义</td>
                    <td className="py-3 pr-4">结构与阶级</td>
                    <td className="py-3 pr-4 whitespace-nowrap">马克思</td>
                    <td className="py-3 pr-4 whitespace-nowrap">资本论</td>
                    <td className="py-3">经济决定结构</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">存在主义</td>
                    <td className="py-3 pr-4">如何活着</td>
                    <td className="py-3 pr-4 whitespace-nowrap">尼采</td>
                    <td className="py-3 pr-4 whitespace-nowrap">查拉图斯特拉如是说</td>
                    <td className="py-3">重估一切价值</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">存在主义</td>
                    <td className="py-3 pr-4">自由与荒诞</td>
                    <td className="py-3 pr-4 whitespace-nowrap">加缪</td>
                    <td className="py-3 pr-4 whitespace-nowrap">西西弗神话</td>
                    <td className="py-3">直面荒诞</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">现象学</td>
                    <td className="py-3 pr-4">意识如何显现</td>
                    <td className="py-3 pr-4 whitespace-nowrap">胡塞尔</td>
                    <td className="py-3 pr-4 whitespace-nowrap">观念一</td>
                    <td className="py-3">回到事情本身</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">解释学</td>
                    <td className="py-3 pr-4">理解如何发生</td>
                    <td className="py-3 pr-4 whitespace-nowrap">伽达默尔</td>
                    <td className="py-3 pr-4 whitespace-nowrap">真理与方法</td>
                    <td className="py-3">理解是历史性的</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">分析哲学</td>
                    <td className="py-3 pr-4">语言与逻辑</td>
                    <td className="py-3 pr-4 whitespace-nowrap">维特根斯坦</td>
                    <td className="py-3 pr-4 whitespace-nowrap">哲学研究</td>
                    <td className="py-3">语言即世界边界</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">结构主义</td>
                    <td className="py-3 pr-4">隐含结构</td>
                    <td className="py-3 pr-4 whitespace-nowrap">福柯</td>
                    <td className="py-3 pr-4 whitespace-nowrap">规训与惩罚</td>
                    <td className="py-3">权力无处不在</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">后现代</td>
                    <td className="py-3 pr-4">反宏大叙事</td>
                    <td className="py-3 pr-4 whitespace-nowrap">德里达</td>
                    <td className="py-3 pr-4 whitespace-nowrap">论文字学</td>
                    <td className="py-3">解构中心</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">实用主义</td>
                    <td className="py-3 pr-4">有用即真</td>
                    <td className="py-3 pr-4 whitespace-nowrap">威廉·詹姆斯</td>
                    <td className="py-3 pr-4 whitespace-nowrap">实用主义</td>
                    <td className="py-3">真理可用</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">心理哲学</td>
                    <td className="py-3 pr-4">自我与意识</td>
                    <td className="py-3 pr-4 whitespace-nowrap">艾里克·伯恩</td>
                    <td className="py-3 pr-4 whitespace-nowrap">人间游戏</td>
                    <td className="py-3">人的互动脚本</td>
                  </tr>
                  <tr className="border-b border-[#eee] dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#444] font-bold dark:text-gray-200">当代通识</td>
                    <td className="py-3 pr-4">理性与人生</td>
                    <td className="py-3 pr-4 whitespace-nowrap">以赛亚·伯林</td>
                    <td className="py-3 pr-4 whitespace-nowrap">自由论</td>
                    <td className="py-3">消极自由 vs 积极自由</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
