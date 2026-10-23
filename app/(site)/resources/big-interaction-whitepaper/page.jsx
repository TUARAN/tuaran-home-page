import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import PlateExhibition from './PlateExhibition'
import styles from './whitepaper.module.css'

export const dynamic = 'force-static'

const path = '/resources/big-interaction-whitepaper'
const url = `https://2aran.com${path}`
const shareUrl = 'https://2aran.com/x'
const title = '大互动理论'
const description = '一本关于主动交流、认真倾听、接收反馈与守住边界的实践读本。循着卷首图版与五章内容，建立自己的互动方法。'

export const metadata = {
  title: `${title}｜互动、反馈与边界`,
  description,
  keywords: ['大互动理论', '真实互动', '反馈', '自我成长', '社交关系'],
  alternates: { canonical: path },
  openGraph: { type: 'article', title, description, url, locale: 'zh_CN', images: ['/resources/big-interaction-whitepaper/03.jpg'] },
  twitter: { card: 'summary_large_image', title, description },
}

const chapters = [
  { id: 'foreword', number: '序', title: '从一次交流开始' },
  { id: 'plates', number: '卷首', title: '四张图版与观点' },
  { id: 'framework', number: '第一章', title: '走向互动之前', points: [['care', '1.1 照顾日常'], ['opening', '1.2 打开接触']] },
  { id: 'mechanism', number: '第二章', title: '互动怎样形成反馈', points: [['express', '2.1 发起交流'], ['listen', '2.2 倾听与追问'], ['revise', '2.3 带走一次修正']] },
  { id: 'quality', number: '第三章', title: '判断互动的质量', points: [['frequency', '3.1 次数与持续性'], ['depth', '3.2 深度与对象'], ['value', '3.3 内容价值']] },
  { id: 'practice', number: '第四章', title: '七日实践', points: [['weekly-plan', '4.1 一周行动表'], ['review', '4.2 复盘三个问题']] },
  { id: 'boundaries', number: '第五章', title: '边界与局限', points: [['choice', '5.1 自愿与退出'], ['scope', '5.2 方法的适用范围']] },
]

const dimensions = [
  { number: '01', title: '互动次数', question: '是否有足够的接触机会？', detail: '记录接触频率，但不把频率直接等同于关系质量。' },
  { number: '02', title: '互动深度', question: '是否交换了真实的想法？', detail: '留意讨论是否超越礼貌寒暄，容纳具体经历和不同意见。' },
  { number: '03', title: '互动对象', question: '是否接触到不同视角？', detail: '与同频伙伴建立长期关系，也给跨领域、跨经验的交流留空间。' },
  { number: '04', title: '内容价值', question: '是否带来启发或共鸣？', detail: '观察交流是否提供事实、方法、问题或情感支持。' },
  { number: '05', title: '互动持续性', question: '是否能在时间中积累？', detail: '关注稳定回应与后续行动，而非一次热闹的瞬间。' },
]

const plates = [
  { src: '/resources/big-interaction-whitepaper/04.jpg', width: 1122, height: 1402, title: '三层递进', viewpoint: '先照顾好身体，再走向更大的世界。', caption: '睡眠、饮水与互动，组成从恢复到探索的行动阶梯。' },
  { src: '/resources/big-interaction-whitepaper/02.jpg', width: 688, height: 1024, title: '走出封闭', viewpoint: '主动走出去，让陌生的观点进入生活。', caption: '表达、倾听与结识新朋友，让熟悉的视角有机会被更新。' },
  { src: '/resources/big-interaction-whitepaper/03.jpg', width: 941, height: 1656, title: '行动循环', viewpoint: '接近边界，接收反馈，再修正行动。', caption: '从主动互动到获得反馈，反复校准自己的表达与判断。原图下半部含图书推广信息。' },
  { src: '/resources/big-interaction-whitepaper/01.jpg', width: 1024, height: 1516, title: '互动质量', viewpoint: '每一次互动，都值得认真对待。', caption: '次数、深度、对象、内容价值与持续性，帮助复盘互动的质量。' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: title,
  description,
  url,
  inLanguage: 'zh-CN',
  author: { '@type': 'Person', name: 'TUARAN' },
  datePublished: '2026-10-20',
  image: plates.map((plate) => `https://2aran.com${plate.src}`),
}

export default function BigInteractionWhitepaperPage() {
  return (
    <PageContainer width="standard" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ContentPvBeacon category="resource" slug="big-interaction-whitepaper" />

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><Link href="/articles?group=resource">资源</Link><span>/</span><span>电子读本 · 2026.10</span></div>
          <p className={styles.kicker}>A FIELD GUIDE TO BIG INTERACTION</p>
          <h1>大互动<span>理论</span></h1>
          <p className={styles.heroLead}>互动、反馈与边界</p>
          <p className={styles.heroDescription}>让判断走进真实交流，让行动接受反馈，逐步拓展自己能理解和参与的世界。</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#foreword">开始阅读 <span aria-hidden="true">→</span></a>
            <span className={styles.coverByline}>TUARAN 著 · 第一版</span>
          </div>
        </div>
        <div className={styles.heroMark} aria-hidden="true"><span>互</span><span>动</span><i>∞</i><small>2ARAN.COM/X</small></div>
      </header>

      <div className={styles.readingGrid}>
        <aside className={styles.toc} aria-label="大互动理论目录">
          <p>目录 <span>CONTENTS</span></p>
          <nav aria-label="章节目录"><ol>{chapters.map((chapter) => <li key={chapter.id}>
            <a className={styles.tocChapter} href={`#${chapter.id}`}><span>{chapter.number}</span>{chapter.title}</a>
            {chapter.points ? <ol className={styles.tocPoints}>{chapter.points.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol> : null}
          </li>)}</ol></nav>
          <span className={styles.tocMeta}>第一版 · TUARAN</span>
        </aside>

        <article className={styles.paper}>
          <section id="foreword" className={styles.section}>
            <p className={styles.sectionIndex}>PREFACE / 序</p>
            <h2>从一次交流开始</h2>
            <p className={styles.lead}>大互动理论关注一个朴素的过程：主动接触他人，表达自己的判断，听见不同的经验，再带着反馈调整行动。</p>
            <p>交流可以从一条认真写下的评论、一次追问、一段共同完成的工作开始。关键在于对方能够回应，你也愿意根据回应重新检查自己的想法。</p>
            <blockquote>互动让判断接受现实检验；反馈让行动有下一次改进的方向。</blockquote>
            <p>这本读本从日常基础、交流循环、质量判断、七日实践与边界五个方面展开。卷首图版提供观察线索，练习则留给每个人按自己的处境调整。</p>
          </section>

          <PlateExhibition plates={plates} />

          <section id="framework" className={styles.section}>
            <p className={styles.sectionIndex}>CHAPTER 01 / 第一章</p>
            <h2>走向互动之前</h2>
            <p className={styles.lead}>留出精力，才能把注意力放到别人身上，也能在讨论之后继续思考。</p>
            <h3 id="care">1.1 照顾日常</h3>
            <p>卷首图版把睡眠、饮水和互动画成向上的台阶。它提醒我们：在疲惫、口渴或压力过高时，先处理眼前的身体需要。稳定的生活节律能为交流留出空间。</p>
            <div className={styles.steps}>
              <div><span>01 / 恢复</span><h3>睡得好</h3><p>保持适合自己的睡眠节律，让注意力和情绪有恢复的机会。</p></div>
              <div><span>02 / 支持</span><h3>喝够水</h3><p>把饮水和基本生活照顾落实到日常，而非依赖短期的放纵补偿。</p></div>
              <div><span>03 / 探索</span><h3>多互动</h3><p>在有余力时主动接触人、观点和情境，检验原有的判断。</p></div>
            </div>
            <p className={styles.smallNote}>这些台阶是生活经验的表达，并不构成医学上的因果顺序。睡眠和饮水需求因人而异。</p>
            <h3 id="opening">1.2 打开接触</h3>
            <p>从一个能承受的场景开始：回复一条值得讨论的观点，向熟人请教一个具体问题，或参加有共同目标的活动。接触范围可以逐渐扩大，节奏由自己决定。</p>
          </section>

          <section id="mechanism" className={styles.section}>
            <p className={styles.sectionIndex}>CHAPTER 02 / 第二章</p>
            <h2>互动怎样形成反馈</h2>
            <p className={styles.lead}>一次交流会留下新的事实、分歧或合作机会。把它们带入下一次行动，互动才开始积累。</p>
            <div className={styles.flow} aria-label="大互动行动循环">
              {['发起交流', '倾听追问', '接收反馈', '修正行动'].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}
            </div>
            <h3 id="express">2.1 发起交流</h3>
            <p>说明自己观察到了什么、根据什么作出判断、还想知道什么。具体的问题比空泛的赞同或反对更容易让对方接上话。</p>
            <h3 id="listen">2.2 倾听与追问</h3>
            <p>先确认对方真正表达的意思，再追问事实来源、适用条件和不同经历。意见不同的时候，暂时保留分歧，也能把讨论推进一步。</p>
            <h3 id="revise">2.3 带走一次修正</h3>
            <p>交流结束后记下一个新信息、一处尚未解决的疑问，以及下一步能验证的小行动。反馈可能带来支持，也可能暴露表达问题；修正发生在后续行动里。</p>
          </section>

          <section id="quality" className={styles.section}>
            <p className={styles.sectionIndex}>CHAPTER 03 / 第三章</p>
            <h2>判断互动的质量</h2>
            <p className={styles.lead}>次数能说明接触机会，深度、对象、内容与持续性帮助理解交流留下了什么。</p>
            <div className={styles.dimensionGrid}>{dimensions.map((item) => <div key={item.number} className={styles.dimension}><span>{item.number}</span><h3>{item.title}</h3><strong>{item.question}</strong><p>{item.detail}</p></div>)}</div>
            <h3 id="frequency">3.1 次数与持续性</h3>
            <p>接触少时，可以增加合适的交流机会；接触多时，注意是否还有时间消化反馈。稳定的回应和后续行动，比某一天的数字更能说明关系是否在积累。</p>
            <h3 id="depth">3.2 深度与对象</h3>
            <p>和熟悉的人建立信任，也和经验不同的人交换看法。深度来自具体经历、充分的上下文，以及允许对方提出不同意见的空间。</p>
            <h3 id="value">3.3 内容价值</h3>
            <p>问自己：这次交流是否让我更清楚地理解问题、对方或自己？一条可靠的事实、一个有用的方法、一句诚实的提醒，都可能比大量礼貌回应更有价值。</p>
            <p className={styles.smallNote}>五个维度是个人复盘线索，不是给别人打分的量表。</p>
          </section>

          <section id="practice" className={styles.section}>
            <p className={styles.sectionIndex}>CHAPTER 04 / 第四章</p>
            <h2>七日实践</h2>
            <p className={styles.lead}>用一周时间完成七个小动作。可以跳过不适合自己的环节，也可以把一天的练习延长到一周。</p>
            <h3 id="weekly-plan">4.1 一周行动表</h3>
            <ol className={styles.practiceList}>
              <li><strong>第一天 · 选一个场景</strong><span>从愿意参与的社区、朋友对话或共同项目开始。</span></li>
              <li><strong>第二天 · 提出问题</strong><span>说清自己知道什么，以及仍想弄明白什么。</span></li>
              <li><strong>第三天 · 认真听完</strong><span>先复述对方的意思，再回应具体观点。</span></li>
              <li><strong>第四天 · 提供帮助</strong><span>分享一条可靠资料、一段经验，或一次可落实的协助。</span></li>
              <li><strong>第五天 · 接触异议</strong><span>问清判断依据，记录自己原本忽略的条件。</span></li>
              <li><strong>第六天 · 完成合作</strong><span>围绕一个小目标分工，并及时反馈进展。</span></li>
              <li><strong>第七天 · 回看修正</strong><span>留下有用的反馈，决定下周要改变的一件事。</span></li>
            </ol>
            <h3 id="review">4.2 复盘三个问题</h3>
            <div className={styles.promptBox}><p>哪次交流改变了我的看法？</p><p>我从谁那里得到帮助，又给谁提供了具体回应？</p><p>下周我准备验证或修正哪一个判断？</p></div>
          </section>

          <section id="boundaries" className={styles.section}>
            <p className={styles.sectionIndex}>CHAPTER 05 / 第五章</p>
            <h2>边界与局限</h2>
            <h3 id="choice">5.1 自愿与退出</h3>
            <p>互动需要自愿、尊重和时间边界。独处、拒绝无效交流、暂停高消耗关系，都是合理的选择。面对冒犯或骚扰，结束接触比“继续互动”更重要。</p>
            <h3 id="scope">5.2 方法的适用范围</h3>
            <p>互动机会受到工作、照护责任、健康和资源条件影响。交流次数和点赞、关注等平台动作，不能衡量人的价值或关系质量。这套方法适合自我观察与小范围实践，尚无足以证明其普遍因果效果的研究数据。</p>
          </section>
        </article>
      </div>

      <footer className={styles.footer}><span>大互动理论 · TUARAN · 2026 年 10 月</span><div className={styles.footerActions}><a href="#foreword">返回序言 ↑</a><SharePageButton title={title} text={description} url={shareUrl} exactUrl shorten={false} size="md" idleLabel="分享本书" /></div></footer>
    </PageContainer>
  )
}
