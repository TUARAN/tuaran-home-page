import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'
export default function SociologyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">读无用书 · 社会学</h1>
            <p className="text-sm text-[#666] mt-2">这里会整理社会学相关的阅读记录。</p>
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
                  href="#guide"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  漫谈组织空转
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#talk-1" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      漫谈1
                    </a>
                  </li>
                  <li>
                    <a href="#talk-2" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      漫谈2
                    </a>
                  </li>
                  <li>
                    <a href="#talk-3" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      漫谈3
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  href="#aphorisms"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  格言致知
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="guide" className="text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              漫谈组织空转
            </h2>

            <div className="mt-6 text-sm text-[#666] space-y-4 dark:text-gray-300">
              <h3 id="talk-1" className="text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
                漫谈1｜结构先于个体
              </h3>
              <p className="m-0">
                从组织结构层面看，“空转”往往并非源于个人能力或态度，而是内嵌在组织形态之中。多中心、多条线、重中台、重支撑的结构，使流程天然趋向膨胀，责任天然趋向分散。治理、合规与支撑体系不断扩张，前台业务与执行单元却被切割成多个细小节点，结果是“规则在增长，产出在稀释”。在这种结构下，流程越来越像一个自我维护的系统，它的首要目标不再是推动结果，而是证明自身的必要性与完备性。
              </p>
              <p className="m-0">
                当流程密度超过组织的执行承载力后，组织行为会发生整体偏移。责任被分解进节点，节点被包裹进流程，每个人只需保证“自己这一关没问题”，而不再需要对整体结果负责。执行能力在反复协调中被消耗，数据逐渐从反映现实转向服务考核与合规。所谓“退化”，并非一次失败导致，而是结构长期运行后的必然结果：流程越严密，真实产出反而越难成为系统的核心指标。
              </p>

              <h3 id="talk-2" className="pt-4 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
                漫谈2｜理性自保的合成结果
              </h3>
              <p className="m-0">
                组织空转并不是因为“不努力”，而是因为在高风险、强问责、弱激励的环境中，理性选择被系统性地导向了自保。当失败的代价远高于成功的回报时，最安全的行为就不再是把事做成，而是把责任分散、把痕迹做足。流程开始服务于免责，数据开始服务于证明“我做过”，而非解释真实发生了什么。
              </p>
              <p className="m-0">
                这种局部理性的持续叠加，会把组织整体推向低效却稳定的状态。流程看似严谨，责任却不断模糊；指标看似完整，信号却逐渐失真。KPI 从工具变成噪声，合规从手段变成目的。组织并非不知道问题存在，而是任何试图改变结构的人，都会率先暴露在风险之下。于是，系统选择继续沿着最安全、最可预测的路径运转，即便这条路径早已偏离了最初想要抵达的目标。
              </p>

              <h3 id="talk-3" className="pt-4 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
                漫谈3｜平均主义与“被消解的个人贡献”
              </h3>
              <p className="m-0">
                在许多大型国企的运行逻辑中，“平均”并非一个偶然结果，而是一种深层次的制度取向。无论在薪酬分配、绩效评价，还是在机会与资源的配置上，基层个体之间的差幅往往被刻意压缩。这种压缩并不一定体现在绝对收入的低，而体现在边际回报的钝化：多做与少做、做深与做浅，在结果上并不会拉开足以改变命运的差距。其背后的思想基础，与公有制语境中对“集体”“组织”的强调高度一致——成果首先属于组织，其次才是个人；能力被视为组织赋予的平台效应，而非个体独立价值的体现。于是，一件事情即便主要由某个具体的人推动完成，叙事上也往往要回收为“组织决策正确”“领导统筹有力”“团队协作到位”。
              </p>
              <p className="m-0">
                这种平均主义在稳定系统方面确实有效，但它同时也在无声地重塑个体的行为模式。当个人贡献无法被清晰区分、明确定价时，最理性的选择自然不是“把事做到最好”，而是“把姿态做到位”。表达感谢、强调培养、反复确认“是组织给了我机会”，逐渐成为一种默认的安全语言。个人的主动性被消解进集体话术之中，真实的能力差异被抹平为态度与配合度的差异。久而久之，组织内部形成了一种微妙的平衡：既没有人被真正否定，也没有人被真正奖励；既不鼓励冒进，也不鼓励出头。系统因此显得平稳，却也难以孕育出强烈的内生动力。对个体而言，理解这种“平均”的边界，或许比对抗它更现实——在组织叙事之外，为自己保留一条不完全依赖平均回报的成长与价值沉淀路径。
              </p>
            </div>
            <h2 id="aphorisms" className="mt-12 text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              格言致知
            </h2>

            <div className="mt-6 text-sm text-[#666] space-y-4 dark:text-gray-300">
              <p className="m-0">1、顶级的猎手都是以猎物的方式出现。</p>
              <p className="m-0">2、今日之蜜饯、他日之砒霜。</p>
            </div>          </section>
        </main>
      </div>
    </div>
  )
}
