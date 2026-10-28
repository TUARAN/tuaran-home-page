import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import ChapterNav from './ChapterNav'
import PlateExhibition from './PlateExhibition'
import styles from './whitepaper.module.css'

export const dynamic = 'force-static'

const path = '/resources/big-interaction-whitepaper'
const url = `https://2aran.com${path}`
const shareUrl = 'https://2aran.com/x'
const title = '大互动理论'
const description = '一本关于主动交流、认真倾听、接收反馈与守住边界的实践读本。循着三层日常台阶、五段行动循环、互动质量整理、七日实践与退出边界，建立自己的互动方法。'
const published = '2026-10-20'
const updated = '2026-10-28'

export const metadata = {
  title: `${title}｜互动、反馈与边界`,
  description,
  keywords: ['大互动理论', '真实互动', '反馈', '互动质量', '自我成长', '社交关系'],
  alternates: { canonical: path },
  openGraph: { type: 'article', title, description, url, locale: 'zh_CN', images: ['/resources/big-interaction-whitepaper/03.jpg'] },
  twitter: { card: 'summary_large_image', title, description },
}

const chapters = [
  { id: 'foreword', number: '序', title: '从一次交流开始' },
  { id: 'plates', number: '卷首', title: '卷首图版' },
  { id: 'framework', number: '第一章', title: '走向互动之前' },
  { id: 'mechanism', number: '第二章', title: '互动怎样形成反馈' },
  { id: 'quality', number: '第三章', title: '判断互动的质量' },
  { id: 'practice', number: '第四章', title: '七日实践' },
  { id: 'boundaries', number: '第五章', title: '边界与局限' },
]

const layers = [
  { number: '01', title: '大睡理论', action: '睡好觉，养足精神', detail: '先恢复注意力和情绪，再安排需要回应的交流。疲惫时做出的判断，往往经不起第二天再看。' },
  { number: '02', title: '大水理论', action: '多喝水，少喝饮料', detail: '把饮水和基本生活照顾放进白天的节奏里。身体有稳定支持，才留得住听完一段不同意见的精力。' },
  { number: '03', title: '大互动理论', action: '到能回应的场合里交流', detail: '走出一个人的郁闷，去可以说话、也可以被追问的地方。互动从一次真实回应开始，数量只是接触机会。' },
]

const innerCycle = [
  { number: '01', title: '互相鼓励', detail: '先让对方愿意把话说完。' },
  { number: '02', title: '观点碰撞', detail: '把不同意见放到同一件事上比较。' },
  { number: '03', title: '认识自我', detail: '看见自己原本忽略的条件。' },
  { number: '04', title: '调整行动', detail: '把一个修正带进下一次表达。' },
]

const outerCycle = ['理解边界', '逼近极限', '获得反馈', '修正行为', '突破边界']

const openingMoves = [
  { number: '01', title: '走出封闭', detail: '每天选一个还承受得住的接触：回复一个具体观点，向熟人请教一个问题，或参加有共同目标的活动。目的是让信息来源多出一种对照。' },
  { number: '02', title: '互动真诚', detail: '说明自己看到了什么、依据是什么、还想知道什么。意见不同时把这段话说完。一两句不顺耳的话，先拆开看哪些是信息。' },
  { number: '03', title: '持续修正', detail: '记下边界、感受和有用的反馈，带回下一次行动。分享自己的经历和偏好，是为了让对方知道怎么与你合作。' },
]

const dimensions = [
  { number: '01', title: '互动次数', question: '是否有足够的接触机会？', detail: '记录接触频率。次数说明机会多少，不能直接换成关系质量。' },
  { number: '02', title: '互动深度', question: '是否交换了真实的想法？', detail: '看讨论有没有越过寒暄，出现具体经历、事实来源和不同意见。' },
  { number: '03', title: '互动对象', question: '是否同频，能否双向回应？', detail: '同频指的是能把一件事谈下去。单向广播、从不回应，都不构成互动。' },
  { number: '04', title: '内容价值', question: '是否带来启发或共鸣？', detail: '一次交流可以留下事实、方法、问题或情感支持。礼貌点头留不下这些。' },
  { number: '05', title: '互动持续性', question: '是否有稳定的后续？', detail: '看回应能否跨过一天，以及有没有人把讨论推进到下一次行动。' },
]

const clearSources = [
  { title: '长期不更新', detail: '内容停更，已经不能提供新的对照。' },
  { title: '只发广告', detail: '每条都在带货或导流，缺少可讨论的判断。' },
  { title: '重复搬运', detail: '同一套说法反复出现，看不到来源和语境。' },
  { title: '从不回应', detail: '关注或评论之后没有回声，关系停在单向。' },
  { title: '标题盖过事实', detail: '情绪和口号很响，具体经历、数据和条件很少。' },
]

const keepSources = [
  { title: '同频伙伴', detail: '能把同一件事谈完，也接受不同结论。' },
  { title: '有深度的创作者', detail: '写清事实、方法和适用条件，值得回看。' },
  { title: '可以互相学习的同行', detail: '经验接近，能指出你忽略的操作细节。' },
  { title: '真诚回应的朋友', detail: '记得上下文，也愿意说出不同意的地方。' },
  { title: '可能一起做事的人', detail: '讨论能落到一个小目标、一次分工或一次反馈。' },
]

const weekPlan = [
  { day: '第一天 · 选一个场景', detail: '从愿意参与的社区、朋友对话或共同项目开始，并写清这次最多花多少时间。' },
  { day: '第二天 · 提出问题', detail: '说清自己已经知道什么，以及仍想弄明白的一个具体问题。' },
  { day: '第三天 · 认真听完', detail: '先复述对方的意思，再回应其中的事实、条件和结论。' },
  { day: '第四天 · 提供帮助', detail: '分享一条可靠资料、一段亲身经验，或一次可以落实的协助。' },
  { day: '第五天 · 接触异议', detail: '问清判断依据，记下自己原本忽略的条件。侮辱和骚扰在这里停止。' },
  { day: '第六天 · 完成合作', detail: '围绕一个小目标分工，约定谁在什么时候反馈进展。' },
  { day: '第七天 · 回看修正', detail: '留下有用的反馈，整理信息来源，决定下周只改变一件事。' },
]

const challengeMoves = [
  { plate: '评论 1000 条', action: '留下一条有事实或问题的回应', note: '图版写的是「真诚互动，留下有价值的观点」。' },
  { plate: '点赞 2000 个', action: '只标记自己真的想再看的内容', note: '图版写的是「发现更多优质内容」。' },
  { plate: '关注 200 个', action: '结识一个能双向交流的人，并清掉一个不再回应的来源', note: '图版写的是「主动结识同频的伙伴」。' },
  { plate: '发帖 200 条', action: '分享一段自己的观察或思考', note: '图版写的是「持续输出，分享思考」。' },
]

const signposts = ['持续行动', '真诚互动', '不断优化', '逼近极限', '看到风景']

const plates = [
  { src: '/resources/big-interaction-whitepaper/04.jpg', width: 1122, height: 1402, title: '三层递进', viewpoint: '先照顾好身体，再走向更大的世界。', caption: '大睡、大水、大互动组成台阶。互动一层里的小循环是互相鼓励、观点碰撞、认识自我、调整行动。' },
  { src: '/resources/big-interaction-whitepaper/02.jpg', width: 688, height: 1024, title: '走出封闭', viewpoint: '主动走出去，让陌生的观点进入生活。', caption: '独处可以保留。图版把下一步收成走出封闭、互动真诚、持续修正，并指向新朋友、新视角和新机会。' },
  { src: '/resources/big-interaction-whitepaper/03.jpg', width: 941, height: 1656, title: '行动循环', viewpoint: '接近边界，接收反馈，再修正行动。', caption: '理解边界、逼近极限、获得反馈、修正行为、突破边界。原图下半部是图书推广，不属于这套方法。' },
  { src: '/resources/big-interaction-whitepaper/01.jpg', width: 1024, height: 1516, title: '互动质量', viewpoint: '每一次互动，都值得认真对待。', caption: '用次数、深度、对象、内容价值与持续性复盘。一边清理无效来源，一边留下能双向交流的人。' },
  { src: '/resources/big-interaction-whitepaper/05.webp', width: 1024, height: 1529, title: '持续练习', viewpoint: '选择能持续的行动，认真交流并根据反馈调整。', caption: '每日挑战画成 1000 条评论、2000 个点赞、200 个关注和 200 条发帖。这些是画面设定，旁边的注释才是可执行的意图。' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: title,
  description,
  url,
  inLanguage: 'zh-CN',
  author: { '@type': 'Person', name: 'TUARAN' },
  datePublished: published,
  dateModified: updated,
  image: plates.map((plate) => `https://2aran.com${plate.src}`),
  hasPart: chapters.map((chapter) => ({
    '@type': 'CreativeWork',
    name: `${chapter.number} ${chapter.title}`,
    url: `${url}#${chapter.id}`,
  })),
}

export default function BigInteractionWhitepaperPage() {
  return (
    <>
      <PageContainer width="standard" className={styles.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

        <header className={styles.masthead}>
          <p className={styles.kicker}>BIG INTERACTION · 实践读本</p>
          <h1>{title}</h1>
          <p className={styles.deck}>从好好照顾自己，到在互动中认识自己、拓展还能退出的边界。</p>
          <p className={styles.metaLine}>
            <time dateTime={published}>{published}</time>
            <span>更新 {updated}</span>
            <span>五章 · 约 6 分钟</span>
            <ContentPvBeacon category="resource" slug="big-interaction-whitepaper" display prefix="·" />
          </p>
        </header>

        <div className={styles.readingLayout}>
          <ChapterNav chapters={chapters} />

          <article className={styles.paper}>
            <section id="foreword" className={styles.section}>
              <p className={styles.sectionIndex}>PREFACE / 序</p>
              <h2>从一次交流开始</h2>
              <p className={styles.lead}>大互动理论关注一个可以重复的过程：主动接触他人，表达自己的判断，听见不同的经验，再带着反馈调整行动。</p>
              <p>交流可以从一条认真写下的评论、一次追问、一段共同完成的工作开始。对方能够回应，你也愿意根据回应重新检查自己的想法，这一次接触才算进入互动。</p>
              <blockquote>互动让判断接受现实检验；反馈让行动有下一次改进的方向。</blockquote>
              <p>卷首五张图提供观察线索：日常台阶、走出封闭、行动循环、互动质量、持续练习。后面五章把这些线索收成可以执行的动作，并写明什么时候该停。</p>
            </section>

            <PlateExhibition plates={plates} />

            <section id="framework" className={styles.section}>
              <p className={styles.sectionIndex}>CHAPTER 01 / 第一章</p>
              <h2>走向互动之前</h2>
              <p className={styles.lead}>留出精力，才能把注意力放到别人身上，也能在讨论之后继续思考。</p>
              <h3 id="care">1.1 三层台阶</h3>
              <p>卷首第一张图把睡眠、饮水和互动画成向上的台阶，标题是「从好好照顾自己，到在互动中认识自己」。台阶下面还画着大吃大喝和长时间娱乐，注明那可能只是短暂补偿。三层名称来自图版，用来安排一天的顺序。</p>
              <div className={styles.steps}>
                {layers.map((item) => (
                  <div key={item.number}>
                    <span>{item.number}</span>
                    <h3>{item.title}</h3>
                    <strong>{item.action}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
              <p>互动那一层里面还有一个小循环。它不替代睡眠和饮水，只描述一次交流内部怎样推进。</p>
              <div className={styles.chipRow} aria-label="互动内部循环">
                {innerCycle.map((item) => (
                  <div key={item.number}>
                    <b>{item.number}</b>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
              <p className={styles.smallNote}>这些台阶是生活经验的表达，并不构成医学上的因果顺序。睡眠和饮水需求因人而异，这里不提供诊断或治疗建议。</p>
              <h3 id="opening">1.2 打开接触</h3>
              <p>第二张图从洞穴里的独处画到洞口的人群。独处可以保留，它常常是整理想法的时间。长期只接收同一类信息，判断就缺少对照。图版把「关注之后看见的新世界」收成四样东西：新朋友、新视角、新机会，以及因此变得更具体的世界。</p>
              <div className={styles.steps}>
                {openingMoves.map((item) => (
                  <div key={item.number}>
                    <span>{item.number}</span>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
              <p>图上写着「该吃吃、该喝喝」。这句话管的是情绪：把生活照常过下去，不让一两句话占满一整天。饮水仍按上一节的建议，少喝含糖饮料，喝水按自己的需要来。</p>
            </section>

            <section id="mechanism" className={styles.section}>
              <p className={styles.sectionIndex}>CHAPTER 02 / 第二章</p>
              <h2>互动怎样形成反馈</h2>
              <p className={styles.lead}>一次交流会留下新的事实、分歧或合作机会。把它们带入下一次行动，互动才开始积累。</p>
              <div className={styles.flow} aria-label="大互动行动循环">
                {outerCycle.map((item, index) => (
                  <div key={item}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <h3 id="edge">2.1 理解边界，再逼近一点</h3>
              <p>先写清自己现在能参与的场合、时间和话题。逼近极限指的是比上次多走一小步：多问一个具体问题，多听完一段不同意见，多完成一次可以退出的合作。主动行动扩大的是接触面。身体不适、照护责任已经占满时间，或者对方不欢迎继续，这一步就停在「理解边界」。</p>
              <h3 id="express">2.2 真诚互动</h3>
              <p>说明自己观察到了什么、根据什么作出判断、还想知道什么。具体的问题比空泛的赞同或反对更容易让对方接上话。尊重不同观点，是把思想碰撞留在同一件事上：事实是否成立，条件是否相同，结论还能不能用。</p>
              <p>图版鼓励「不怕冲突」。可以继续的冲突，是双方都还在讨论问题。侮辱、骚扰、威胁和权力明显不对等的施压，属于停止信号，放到第五章处理。</p>
              <h3 id="revise">2.3 带走一次修正</h3>
              <p>交流结束后记下一个新信息、一处尚未解决的疑问，以及下一步能验证的小行动。反馈可能带来支持，也可能暴露表达问题。修正发生在后续的表达、判断和行动里，不发生在当时的情绪上。</p>
              <p>第三张图把这个过程画成五个路标，底下还有一句：「一个人的世界有多大，取决于他敢于与多大的世界互动。」敢于的前提是还能回来。原图下半部的购书信息是推广，不参与这套循环。</p>
            </section>

            <section id="quality" className={styles.section}>
              <p className={styles.sectionIndex}>CHAPTER 03 / 第三章</p>
              <h2>判断互动的质量</h2>
              <p className={styles.lead}>次数能说明接触机会。深度、对象、内容与持续性，用来看这次交流留下了什么。</p>
              <p>第四张图把同一句话写了两遍：每一次互动、每一个维度的数据，都该用心管理；好的互动关系看真实程度。五个维度是自己复盘的线索。</p>
              <div className={styles.dimensionGrid}>
                {dimensions.map((item) => (
                  <div key={item.number} className={styles.dimension}>
                    <span>{item.number}</span>
                    <h3>{item.title}</h3>
                    <strong>{item.question}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
              <h3 id="sources">3.1 整理信息来源</h3>
              <p>图版中间是一份「我的关注列表」，左边一箱写着清理无效关注，右边一箱写着保留同频伙伴。这是在整理自己的注意力，用来决定接下来把时间花在谁身上。</p>
              <div className={styles.splitGrid}>
                <div>
                  <h3>可以清掉的来源</h3>
                  <ul>
                    {clearSources.map((item) => (
                      <li key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>值得留下的关系</h3>
                  <ul>
                    {keepSources.map((item) => (
                      <li key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <h3 id="frequency">3.2 次数与持续性</h3>
              <p>接触少时，增加一个合适的交流机会。接触多时，检查是否还有时间消化反馈。稳定的回应和后续行动，比某一天的数字更能说明关系是否在积累。</p>
              <h3 id="depth">3.3 深度与对象</h3>
              <p>和熟悉的人建立信任，也和经验不同的人交换看法。深度来自具体经历、充分的上下文，以及允许对方提出不同意见的空间。同频不等于结论相同，它指的是双方都还能把话说完。</p>
              <h3 id="value">3.4 内容价值</h3>
              <p>问自己：这次交流是否让问题、对方或自己变得更清楚？一条可靠的事实、一个有用的方法、一句诚实的提醒，都可能比大量礼貌回应更有价值。</p>
              <p className={styles.smallNote}>五个维度和两份名单都是个人复盘线索，不用来给别人打分，也不衡量人的价值。</p>
            </section>

            <section id="practice" className={styles.section}>
              <p className={styles.sectionIndex}>CHAPTER 04 / 第四章</p>
              <h2>七日实践</h2>
              <p className={styles.lead}>用一周时间完成七个小动作。可以跳过不适合自己的环节，也可以把一天的练习延长到一周。</p>
              <h3 id="weekly-plan">4.1 一周行动表</h3>
              <ol className={styles.practiceList}>
                {weekPlan.map((item) => (
                  <li key={item.day}><strong>{item.day}</strong><span>{item.detail}</span></li>
                ))}
              </ol>
              <h3 id="review">4.2 复盘三个问题</h3>
              <div className={styles.promptBox}>
                <p>哪次交流改变了我的看法？</p>
                <p>我从谁那里得到帮助，又给谁提供了具体回应？</p>
                <p>下周我准备验证或修正哪一个判断？</p>
              </div>
              <h3 id="sources-practice">4.3 用一天整理来源</h3>
              <p>第七天可以顺手做图版上的清理清单：认出长期不更新的来源，清掉纯广告，标出标题盖过事实的内容，记下值得回看的创作者，再补回一个能双向交流的人。整理的结果用一句话收束：少而精，更同频，更真实，更有价值。</p>
              <h3 id="sustainable-practice">4.4 把图版数字译成动作</h3>
              <p>第五张图的标题是「就是逼近极限，就能看到风景」。每日挑战写成评论 1000 条、点赞 2000 个、关注 200 人、发帖 200 条，笔记本上还照抄了一遍。这些数量是画面设定，不适合作为日常指标。旁边的小字写着每项动作真正要完成的事，可以译成这四次。</p>
              <ol className={styles.practiceList}>
                {challengeMoves.map((item) => (
                  <li key={item.plate}><strong>{item.action}</strong><span>{item.plate}。{item.note}</span></li>
                ))}
              </ol>
              <p>路标从近到远写着五步。能由自己决定的是前四步；「看到风景」在图上被画成更清楚的自己、不同的朋友和更大的问题范围。更高的影响力、更好的机会并不由练习次数保证。</p>
              <div className={styles.signpost} aria-label="持续练习的五个路标">
                {signposts.map((item, index) => (
                  <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>
                ))}
              </div>
            </section>

            <section id="boundaries" className={styles.section}>
              <p className={styles.sectionIndex}>CHAPTER 05 / 第五章</p>
              <h2>边界与局限</h2>
              <h3 id="choice">5.1 自愿与退出</h3>
              <p>互动需要自愿、尊重和时间边界。独处、拒绝无效交流、暂停高消耗关系，都是合理的选择。面对冒犯或骚扰，结束接触优先于「继续互动」。</p>
              <h3 id="limit-reading">5.2 怎么理解逼近极限</h3>
              <p>逼近极限以还能退出为前提。比上次多听完一段话、多问一个问题、多参加一次有时间上限的合作，都算逼近。生病、照护、睡眠不足，或者对方已经表示不想继续，停下来就是这次练习的完成。</p>
              <p>不怕冲突指的是把分歧留在事实和条件上。对方开始侮辱、骚扰、威胁，或者你因为身份、工作、年龄处在说不的代价很高的位置，退出是这套方法的一部分。</p>
              <h3 id="scope">5.3 方法的适用范围</h3>
              <p>互动机会受到工作、照护责任、健康和资源条件影响。评论、点赞、关注和发帖不能衡量人的价值或关系质量。行动循环那张图的下半部是图书推广，不属于理论内容。</p>
              <p>这套方法适合自我观察与小范围实践。目前没有足以证明它具有普遍因果效果的研究数据。睡好、喝够、多互动之间也不存在可照搬的医学顺序。</p>
            </section>
          </article>
        </div>

        <footer className={styles.footer}>
          <span>大互动理论 · TUARAN · {published.slice(0, 4)} 年 10 月</span>
          <div className={styles.footerActions}>
            <a href="#foreword">返回序言 ↑</a>
            <SharePageButton title={title} text={description} url={shareUrl} exactUrl shorten={false} size="md" idleLabel="分享本书" />
          </div>
        </footer>
      </PageContainer>
      <ContentEngagement contentKey="resource:big-interaction-whitepaper" width="standard" />
    </>
  )
}
