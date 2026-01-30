import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 财富',
  description: '涂阿燃（tuaran）的读书笔记：财富/理财类阅读记录与整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '财富', '理财', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/wealth',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function WealthReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">读无用书 · 财富</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">这里会整理财富与商业相关的阅读记录。</p>
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
                  href="#principles"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  原则
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="principles" className="text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              原则
            </h2>

            <div className="mt-4 text-sm text-[#666] space-y-4 dark:text-gray-300">
              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">Pain + Reflection = Progress.</div>
                <div>痛苦 + 反思 = 进步。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">Embrace reality and deal with it.</div>
                <div>拥抱现实，并处理现实。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  Truth—or more precisely, an accurate understanding of reality—is the essential foundation for producing good outcomes.
                </div>
                <div>真相——更准确地说，对现实的准确理解——是一切好结果的基础。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  The biggest mistake most people make is to not see themselves and others objectively.
                </div>
                <div>大多数人犯的最大错误，是无法客观地看待自己和他人。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  Don’t confuse what you wish were true with what is really true.
                </div>
                <div>不要把你希望是真的，当成它真的是真的。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  If you can’t acknowledge and accept your mistakes, you won’t learn from them.
                </div>
                <div>如果你无法承认并接受自己的错误，你就无法从中学习。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  Successful people are those who can go above themselves to see things objectively.
                </div>
                <div>成功的人，是那些能够超越自我、客观审视问题的人。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  Remember that most people will fight learning if it threatens their sense of competence.
                </div>
                <div>记住：当学习威胁到自我胜任感时，大多数人会本能抗拒。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  Believability-weighted decision making is the most effective way to make decisions.
                </div>
                <div>按可信度加权进行决策，是最有效的决策方式。</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#444] dark:text-gray-200">
                  A principle is a concept that can be applied over and over again in similar situations.
                </div>
                <div>原则，是一种可以在相似情境中反复应用的概念。</div>
              </div>
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
