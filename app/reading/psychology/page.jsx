import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 心理学',
  description: '涂阿燃（tuaran）的读书笔记：心理学类阅读记录与整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '心理学', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/psychology',
  },
}

export default function PsychologyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">读无用书 · 心理学</h1>
            <p className="text-sm text-[#666] mt-2">这里会整理心理学相关的阅读记录。</p>
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
                  href="#toad"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  蛤蟆先生去看心理医生
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="toad" className="text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              蛤蟆先生去看心理医生
            </h2>
            <div className="mt-4 text-sm text-[#666] space-y-4 dark:text-gray-300">
              <p className="m-0">
                我发现，在《蛤蟆先生去看心理医生》里，有一个很不起眼却极有力量的细节：咨询师反复把蛤蟆的话，从“别人怎么对我”拉回到“我当时是什么感受”。蛤蟆一开始总在讲河鼠、鼹鼠、獾先生，说他们如何评价自己、影响自己的人生状态，而咨询师并不急着分析关系对错，只是不断追问——“那时你感觉如何？”这种追问看似简单，却让蛤蟆第一次意识到，他习惯性地把人生的解释权交给了别人，连情绪本身都成了“他人造成的结果”。
              </p>
              <p className="m-0">
                这个细节让我很容易推己及人。现实中，我也常用同样的方式看待身边的人：同事消极，是环境不好；伴侣暴躁，是性格有问题；朋友疏远，是不够在乎。但书里的这一幕提醒我，很多时候，人真正缺失的不是建议和评判，而是被允许承认自己正在难受。当一个人连“我不舒服”都要先经过合理化、归因、解释，他就很难真正为自己的状态负责。理解这一点之后，再去看他人的退缩、防御或冷漠，就不再只是“态度问题”，而更像是某种尚未被说出口的求生方式。
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
