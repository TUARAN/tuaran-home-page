import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 社会学',
  description: '涂阿燃（tuaran）的读书笔记：社会学/社会观察类阅读记录与摘抄整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '社会学', '社会观察', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/sociology',
  },
}

const APHORISM_GROUPS = [
  {
    title: '生活',
    items: [
      '赚钱三阶段：打工换时薪 → 创作让作品替你赚钱 → 创造会学习进化的“系统”替你赚钱。',
      '年幼的很多念头会散在时间里，只有极少数会陪你长大。',
      '给自己留更多选择权，就是幸福。',
      '自建博客：先写给自己看得舒服，再谈分享带来的快乐；步履不停。',
      '生活是无边舞台，百态尽在其中；接纳不同，别走极端，也别太极式不作为。',
      '时间残忍又奇妙：人会遗忘；尊重过去，才能过好现在。',
      '路不知道通向哪里，但“向前”常是面对迷茫最好的答案。',
      '人皆慕强，不分职业。',
      '起点很重要：起点高则增速快上限高；起点低就得破釜沉舟、厚积薄发。',
      '不要把球留在脚底下：压力往往来自“本可以做但没做”的拖延。',
      '有些话不说你是主人；说出口你就成了它的奴隶。',
      '要做幸存者，不做受害者。',
      '性格写在唇边，幸福露在眼角；表情是近来心境，眉宇是过往岁月。',
    ],
  },
  {
    title: '哲理',
    items: [
      '人在社会，少不了比较；比较里总会埋下得意与失意，也可能悄悄种下嫉妒。',
      '想驯服原始情绪，就得不断驯服自己；身边的人都更强，你也会被带着更强。',
      '兴，百姓苦；亡，百姓更苦。',
      '天地不仁：不偏不倚，万物随其自然；主观判断常会遮住对规律的洞察。',
      '世界不黑不白，而是一道精致的灰。',
      '欲望是动力，也是深渊；人欲与生俱来，但贪得无厌最危险。',
      '风浪越大鱼越贵：舞台很大，敢不敢上台，信心最重要。',
      '从最坏处着眼，向最好处努力。',
      '信念产生行动，行为养成习惯，习惯生成性格，性格决定命运。',
      '慎独。',
      '生命的力量在于不顺从。',
      '不与夏虫语冰。',
      '顶级的猎手都是以猎物的方式出现。',
      '今日之蜜饯、他日之砒霜。',
    ],
  },
  {
    title: '随笔',
    items: [
      '活着为了讲述：不同身份的人，用不同方式把生活讲成故事。',
      '资本往往以资本为中心而非以人为中心；历史在摇摆中前进，理想是资本与劳动彼此尊敬、趋于平衡。',
      '生活即魔幻与现实的结合：浪漫者看魔幻，现实者看现实。',
      '简单，如此迷人。',
      '让朋友低估你的优点，让敌人高估你的缺点。',
      '认真地活在今天；珍惜今日，是对黎明最好的问候。',
    ],
  },
]

export default function SociologyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">读无用书 · 社会学</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">这里会整理社会学相关的阅读记录。</p>
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
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#aphorisms-life" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      生活
                    </a>
                  </li>
                  <li>
                    <a href="#aphorisms-philosophy" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      哲理
                    </a>
                  </li>
                  <li>
                    <a href="#aphorisms-essay" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      随笔
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="guide" className="text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              漫谈组织空转
            </h2>

            <div className="mt-6 text-sm text-[#666] space-y-4 dark:text-gray-300">
              <h3 id="talk-1" className="text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
                漫谈1｜结构先于个体
              </h3>
              <p className="m-0">
                从组织结构层面看，“空转”往往并非源于个人能力或态度，更像是嵌在组织形态里的结果。多中心、多条线、重中台、重支撑的结构，使流程天然趋向膨胀，责任天然趋向分散。治理、合规与支撑体系不断扩张，前台业务与执行单元却被切割成多个细小节点，结果是“规则在增长，产出在稀释”。在这种结构下，流程越来越像一个自我维护的系统，它的首要目标逐渐从推动结果，变成证明自身的必要性与完备性。
              </p>
              <p className="m-0">
                当流程密度超过组织的执行承载力后，组织行为会发生整体偏移。责任被分解进节点，节点被包裹进流程，每个人只需保证“自己这一关没问题”，而不再需要对整体结果负责。执行能力在反复协调中被消耗，数据逐渐从反映现实转向服务考核与合规。所谓“退化”，并非一次失败导致，而是结构长期运行后的必然结果：流程越严密，真实产出反而越难成为系统的核心指标。
              </p>

              <h3 id="talk-2" className="pt-4 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
                漫谈2｜理性自保的合成结果
              </h3>
              <p className="m-0">
                组织空转很少是“不努力”的问题，更常见的原因是：在高风险、强问责、弱激励的环境中，理性选择被系统性地导向了自保。当失败的代价远高于成功的回报时，最安全的行为会从“把事做成”，滑向“把责任分散、把痕迹做足”。流程开始服务于免责，数据开始服务于证明“我做过”，而非解释真实发生了什么。
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
                这种平均主义在稳定系统方面确实有效，但它同时也在无声地重塑个体的行为模式。当个人贡献无法被清晰区分、明确定价时，理性的选择往往会滑向“把姿态做到位”，而不是“把事做到最好”。表达感谢、强调培养、反复确认“是组织给了我机会”，逐渐成为一种默认的安全语言。个人的主动性被消解进集体话术之中，真实的能力差异被抹平为态度与配合度的差异。久而久之，组织内部形成了一种微妙的平衡：既没有人被真正否定，也没有人被真正奖励；既不鼓励冒进，也不鼓励出头。系统因此显得平稳，却也难以孕育出强烈的内生动力。对个体而言，理解这种“平均”的边界，或许比对抗它更现实——在组织叙事之外，为自己保留一条不完全依赖平均回报的成长与价值沉淀路径。
              </p>
            </div>
            <h2 id="aphorisms" className="mt-12 text-[#444] text-lg scroll-mt-24 dark:text-gray-200">
              格言致知
            </h2>

            <div className="mt-6 text-sm text-[#666] space-y-6 dark:text-gray-300">
              {APHORISM_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3
                    id={`aphorisms-${group.title === '生活' ? 'life' : group.title === '哲理' ? 'philosophy' : 'essay'}`}
                    className="text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24"
                  >
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((text, index) => (
                      <p key={`${group.title}-${index}`} className="m-0">
                        {index + 1}、{text}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
