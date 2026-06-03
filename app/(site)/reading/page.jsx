import { Suspense } from 'react'

import ReadingPyramid from '../components/ReadingPyramid'
import ReadingTabs from './ReadingTabs'

export const dynamic = 'force-static'

export const metadata = {
  title: '书库',
  description: '涂阿燃（tuaran）的书库：读书笔记、书评与待写书单，按传记、心理学、社会学、财富、历史、哲学归一化整理。',
  keywords: ['涂阿燃', 'tuaran', '书库', '读书笔记', '书评', '阅读记录', '读无用书', '网络日志'],
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

const readingCategories = [
  {
    no: '1',
    slug: 'biography',
    label: '传记',
    centerTitle: '传记',
    leftTitle: '先看\n人物\n传记',
    rightTitle: '高手的\n通透\n人生',
    description: '从真实人生里观察选择、命运、时代与性格。',
    books: ['苏东坡', '曹操', '王阳明', '曾国藩', '张居正', '左宗棠', '杨绛', '乔布斯', '袁了凡', '袁隆平'],
  },
  {
    no: '2',
    slug: 'psychology',
    label: '心理学',
    centerTitle: '心理学',
    leftTitle: '再看\n心理学',
    rightTitle: '轻松掌握\n各种复杂\n关系',
    description: '理解情绪、防御、关系模式，以及人在压力下如何解释自己。',
    books: ['津巴多普通心理学', '心理学与生活', '社会心理学', '自卑与超越', '自控力', '操纵心理学', '亲密关系', '当下的力量', '象与骑象人'],
  },
  {
    no: '3',
    slug: 'sociology',
    label: '社会学',
    centerTitle: '社会学',
    leftTitle: '接着看\n社会学',
    rightTitle: '明规则，懂\n真相知社会\n深浅',
    description: '把个体命运放回结构、阶层、制度和共同体里理解。',
    books: ['毛选', '盐铁论', '乡土中国', '社会学概论', '商君书', '社会学的邀请', '中国社会各阶层分析', '社会分工论', '回归故里'],
  },
  {
    no: '4',
    slug: 'wealth',
    label: '财富',
    centerTitle: '财富',
    leftTitle: '可以看\n搞钱书了',
    rightTitle: '构建财富观\n提高搞钱认知',
    description: '把赚钱、决策、现实感和长期复利放在同一套框架里看。',
    books: ['原则', '贫穷的本质', '纳瓦尔宝典', '韭菜的自我修养', '财富真相'],
  },
  {
    no: '5',
    slug: 'history',
    label: '历史',
    centerTitle: '历史',
    leftTitle: '接着研究\n历史',
    rightTitle: '以史为鉴',
    description: '从长期周期、制度演化和人物选择里看现实。',
    books: ['典籍里的中国', '资治通鉴', '中国近代史', '中国通史', '历史的温度', '西南联大文学课'],
  },
  {
    no: '6',
    slug: 'philosophy',
    label: '哲学',
    centerTitle: '哲学',
    leftTitle: '最后研究\n哲学',
    rightTitle: '多维看世界，\n格局拉满',
    description: '梳理世界观、价值观、认识论和行动理由。',
    books: ['中国哲学史', '苏菲的世界', '苏格拉底的申辩', '理想国', '世界哲学史', '你的第一本哲学书'],
  },
]

const philosophyRows = [
  ['前苏格拉底', '世界的本原是什么', '赫拉克利特', '论自然', '万物流变'],
  ['古希腊哲学', '真理、德性、城邦', '柏拉图', '理想国', '正义与理想社会'],
  ['古希腊哲学', '逻辑、存在、分类', '亚里士多德', '形而上学', '西方理性地基'],
  ['儒家哲学', '伦理、秩序、角色', '孔子', '论语', '人伦社会设计'],
  ['儒家哲学', '人性与政治', '孟子', '孟子', '性善论'],
  ['道家哲学', '自然、自由、反控制', '老子', '道德经', '无为而治'],
  ['道家哲学', '个体自由', '庄子', '庄子', '精神解放'],
  ['佛学哲学', '苦、空、无常', '龙树', '中论', '破一切执'],
  ['经院哲学', '信仰与理性', '托马斯·阿奎那', '神学大全', '理性为信仰服务'],
  ['理性主义', '理性是否可靠', '笛卡尔', '第一哲学沉思集', '我思故我在'],
  ['经验主义', '知识从何而来', '休谟', '人类理解研究', '因果是习惯'],
  ['批判哲学', '理性边界', '康德', '纯粹理性批判', '认知的天花板'],
  ['德国观念论', '精神与历史', '黑格尔', '精神现象学', '世界是展开的理性'],
  ['功利主义', '如何计算幸福', '边沁、密尔', '功利主义', '最大多数幸福'],
  ['马克思主义', '结构与阶级', '马克思', '资本论', '经济决定结构'],
  ['存在主义', '如何活着', '尼采', '查拉图斯特拉如是说', '重估一切价值'],
  ['存在主义', '自由与荒诞', '加缪', '西西弗神话', '直面荒诞'],
  ['现象学', '意识如何显现', '胡塞尔', '观念一', '回到事情本身'],
  ['解释学', '理解如何发生', '伽达默尔', '真理与方法', '理解是历史性的'],
  ['分析哲学', '语言与逻辑', '维特根斯坦', '哲学研究', '语言即世界边界'],
  ['结构主义', '隐含结构', '福柯', '规训与惩罚', '权力无处不在'],
  ['后现代', '反宏大叙事', '德里达', '论文字学', '解构中心'],
  ['实用主义', '有用即真', '威廉·詹姆斯', '实用主义', '真理可用'],
  ['心理哲学', '自我与意识', '艾里克·伯恩', '人间游戏', '人的互动脚本'],
  ['当代通识', '理性与人生', '以赛亚·伯林', '自由论', '消极自由 vs 积极自由'],
].map(([school, question, figure, book, position]) => ({ school, question, figure, book, position }))

const readingReviews = [
  {
    id: 'mr-toad',
    category: 'psychology',
    kind: '书评',
    title: '《蛤蟆先生去看心理医生》：把解释权从别人手里拿回来',
    summary: '这本书最有价值的地方，不在心理学术语，而在反复把问题从“别人怎么对我”拉回“我当时是什么感受”。',
    paragraphs: [
      '我发现，在《蛤蟆先生去看心理医生》里，有一个很不起眼却极有力量的细节：咨询师反复把蛤蟆的话，从“别人怎么对我”拉回到“我当时是什么感受”。蛤蟆一开始总在讲河鼠、鼹鼠、獾先生，说他们如何评价自己、影响自己的人生状态，而咨询师并不急着分析关系对错，只是不断追问——“那时你感觉如何？”这种追问看似简单，却让蛤蟆第一次意识到，他习惯性地把人生的解释权交给了别人，连情绪本身都成了“他人造成的结果”。',
      '这个细节让我很容易推己及人。现实中，我也常用同样的方式看待身边的人：同事消极，是环境不好；伴侣暴躁，是性格有问题；朋友疏远，是不够在乎。但书里的这一幕提醒我，很多时候，人真正需要的是被允许承认自己正在难受；建议和评判反而未必能帮上忙。当一个人连“我不舒服”都要先经过合理化、归因、解释，他就很难真正为自己的状态负责。理解这一点之后，再去看他人的退缩、防御或冷漠，就不再只是“态度问题”，而更像是某种尚未被说出口的求生方式。',
    ],
  },
  {
    id: 'principles',
    category: 'wealth',
    kind: '读书摘记',
    title: '《原则》：现实感、反思与可信度加权',
    summary: '《原则》对我最有用的不是“成功学”，而是把痛苦、事实、错误、可信度和复盘放进一套可反复使用的决策系统。',
    notes: [
      { original: 'Pain + Reflection = Progress.', text: '痛苦 + 反思 = 进步。' },
      { original: 'Embrace reality and deal with it.', text: '拥抱现实，并处理现实。' },
      {
        original: 'Truth—or more precisely, an accurate understanding of reality—is the essential foundation for producing good outcomes.',
        text: '真相——更准确地说，对现实的准确理解——是一切好结果的基础。',
      },
      { original: 'The biggest mistake most people make is to not see themselves and others objectively.', text: '大多数人犯的最大错误，是无法客观地看待自己和他人。' },
      { original: 'Don’t confuse what you wish were true with what is really true.', text: '不要把你希望是真的，当成它真的是真的。' },
      { original: 'If you can’t acknowledge and accept your mistakes, you won’t learn from them.', text: '如果你无法承认并接受自己的错误，你就无法从中学习。' },
      { original: 'Successful people are those who can go above themselves to see things objectively.', text: '成功的人，是那些能够超越自我、客观审视问题的人。' },
      { original: 'Remember that most people will fight learning if it threatens their sense of competence.', text: '记住：当学习威胁到自我胜任感时，大多数人会本能抗拒。' },
      { original: 'Believability-weighted decision making is the most effective way to make decisions.', text: '按可信度加权进行决策，是最有效的决策方式。' },
      { original: 'A principle is a concept that can be applied over and over again in similar situations.', text: '原则，是一种可以在相似情境中反复应用的概念。' },
    ],
  },
  {
    id: 'philosophy-schools',
    category: 'philosophy',
    kind: '阅读框架',
    title: '哲学派系：按问题意识整理代表书目',
    summary: '先不急着背哲学家名字，而是把每个派系放回它要回答的核心问题里。',
    table: philosophyRows,
  },
]

export default function ReadingIndexPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] pb-5 dark:border-gray-800">
        <h1 className="font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          书库
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">
          这里统一收敛为书评、读书笔记和待写书单；人物、历史、诗歌类资料另归知识库。
        </p>
      </header>

      <section className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center text-2xl font-black tracking-wide text-[#333] dark:text-gray-100 sm:text-3xl">
          构建世界观的阅读顺序
        </div>
        <div className="mx-auto mt-4 max-w-3xl">
          <ReadingPyramid levels={readingCategories} />
        </div>
      </section>

      <Suspense fallback={<div className="mt-8 text-sm text-[#666] dark:text-gray-400">加载书库分类…</div>}>
        <ReadingTabs categories={readingCategories} reviews={readingReviews} />
      </Suspense>
    </main>
  )
}
