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
const title = '大互动绿皮书'
const description = '逼近极限，突破极限，拓展自身边界。浏览四张大互动图版与对应观点，探索真实互动的实践方法。'

export const metadata = {
  title: `${title}｜逼近极限，拓展边界`,
  description,
  keywords: ['大互动理论', '大互动绿皮书', '真实互动', '反馈', '自我成长', '社交关系'],
  alternates: { canonical: path },
  openGraph: { type: 'article', title, description, url, locale: 'zh_CN', images: ['/resources/big-interaction-whitepaper/03.jpg'] },
  twitter: { card: 'summary_large_image', title, description },
}

const chapters = [
  ['abstract', '摘要'],
  ['framework', '01 · 核心框架'],
  ['mechanism', '02 · 互动机制'],
  ['quality', '03 · 质量评估'],
  ['practice', '04 · 实践方法'],
  ['boundaries', '05 · 边界与局限'],
  ['plates', '图版展览'],
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
  { src: '/resources/big-interaction-whitepaper/03.jpg', width: 941, height: 1656, title: '行动循环', viewpoint: '逼近边界，接收反馈，再修正行动。', caption: '从主动互动到获得反馈，反复校准自己的表达与判断。原图下半部含图书推广信息。' },
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
          <div className={styles.eyebrow}><Link href="/articles?group=resource">资源</Link><span>/</span><span>大互动绿皮书 · 2026.10</span></div>
          <p className={styles.kicker}>THE BIG INTERACTION THEORY</p>
          <h1>大互动<span>绿皮书</span></h1>
          <p className={styles.heroLead}>逼近极限，<br />拓展自身边界。</p>
          <p className={styles.heroDescription}>从一条评论、一种回应、一次表达开始，让观点碰撞，让行动得到反馈。</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#plates">观看图版 <span aria-hidden="true">↗</span></a>
            <SharePageButton title={title} text={description} url={shareUrl} exactUrl shorten={false} size="md" idleLabel="分享绿皮书" />
          </div>
        </div>
        <div className={styles.heroMark} aria-hidden="true"><span>互</span><span>动</span><i>∞</i><small>2ARAN.COM/X</small></div>
      </header>

      <PlateExhibition plates={plates} />

      <section className={styles.manifesto} aria-label="大互动理论口号">
        <p className={styles.sectionIndex}>THE BIG INTERACTION MANIFESTO</p>
        <h2>大互动理论，一句话。</h2>
        <p className={styles.manifestoQuote}>如果你每天不互动 <strong>1000 次</strong>（评论），释放正能量 <strong>2000 次</strong>（点赞），带价值的判断 <strong>200 次</strong>（关注），发表观点 <strong>200 次</strong>，就不要和我说话！</p>
        <p className={styles.manifestoSignature}>—— 大互动：逼近极限、才能突破极限、才能拓展自身边界</p>
      </section>

      <div className={styles.readingGrid}>
        <aside className={styles.toc} aria-label="绿皮书目录">
          <p>目录 <span>CONTENTS</span></p>
          <nav>{chapters.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
          <span className={styles.tocMeta}>v1.1 · TUARAN</span>
        </aside>

        <article className={styles.paper}>
          <section id="abstract" className={styles.section}>
            <p className={styles.sectionIndex}>ABSTRACT</p>
            <h2>摘要</h2>
            <p className={styles.lead}>大互动理论是一套关于个人成长与关系质量的实践框架。它主张：在基本的身体照顾之上，主动进入真实的交流场景，接触差异，收集反馈，并据此修正自己的理解与行动。</p>
            <p>“大互动”强调互动的范围、深度和持续性。开篇的 1000、2000、200、200 是一种夸张的动员口号，用来鼓励主动表达与回应；具体次数不能衡量人的价值。能否互相理解、建立信任、形成行动上的改变，决定互动是否有意义。</p>
            <div className={styles.abstractNote}><strong>核心命题</strong><span>照顾自己 → 走出封闭 → 真诚互动 → 获得反馈 → 持续修正</span></div>
          </section>

          <section id="framework" className={styles.section}>
            <p className={styles.sectionIndex}>01 / FRAMEWORK</p>
            <h2>从基础照顾到开放互动</h2>
            <p>四张原始图像把“大睡理论”“大水理论”“大互动理论”画成逐级向上的台阶。这个顺序提供一种生活实践的提醒：先给身体稳定的支持，再为认识世界与他人留出精力。</p>
            <div className={styles.steps}>
              <div><span>01 / 恢复</span><h3>睡得好</h3><p>保持适合自己的睡眠节律，让注意力和情绪有恢复的机会。</p></div>
              <div><span>02 / 支持</span><h3>喝够水</h3><p>把饮水和基本生活照顾落实到日常，而非依赖短期的放纵补偿。</p></div>
              <div><span>03 / 探索</span><h3>多互动</h3><p>在有余力时主动接触人、观点和情境，检验原有的判断。</p></div>
            </div>
            <p className={styles.smallNote}>这是一种叙事顺序，不是医学或心理学上的因果模型。睡眠、饮水需求因人而异。</p>
          </section>

          <section id="mechanism" className={styles.section}>
            <p className={styles.sectionIndex}>02 / MECHANISM</p>
            <h2>互动如何带来改变</h2>
            <p>人在封闭环境中容易反复听见熟悉的观点，也容易把短暂的认可当作充分的理解。主动表达、聆听和共同做事，可以让自己的假设遇到现实中的差异。</p>
            <div className={styles.flow} aria-label="大互动行动循环">
              {['理解边界', '主动互动', '获得反馈', '修正行为'].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}
            </div>
            <p>反馈不一定令人舒服。一次有价值的互动，可能带来支持，也可能暴露误解、知识盲点或表达问题。把反馈转化为新的问题、试验和行动，成长才会发生。</p>
            <blockquote>更大的世界，来自更具体的接触：多听一种经验，多问一个问题，多完成一次合作。</blockquote>
          </section>

          <section id="quality" className={styles.section}>
            <p className={styles.sectionIndex}>03 / QUALITY</p>
            <h2>用五个维度看互动质量</h2>
            <p>图版中的五个维度可用作个人复盘清单。它们帮助辨认关系的结构，不构成评分量表，也不应被用来给他人贴标签。</p>
            <div className={styles.dimensionGrid}>{dimensions.map((item) => <div key={item.number} className={styles.dimension}><span>{item.number}</span><h3>{item.title}</h3><strong>{item.question}</strong><p>{item.detail}</p></div>)}</div>
            <p>例如，清理不再阅读的账号可以减少噪声；保留同频伙伴，同时继续接触不同意见，可以避免信息环境变得单一。衡量标准是交流后是否更清楚地理解问题、对方和自己。</p>
          </section>

          <section id="practice" className={styles.section}>
            <p className={styles.sectionIndex}>04 / PRACTICE</p>
            <h2>一套可执行的七日练习</h2>
            <ol className={styles.practiceList}>
              <li><strong>选择场景</strong><span>找一个愿意参与的社区、朋友聚会或共同项目，以自己能承受的节奏开始。</span></li>
              <li><strong>提出真实问题</strong><span>分享一个正在思考的问题，说明已知事实和仍不确定的部分。</span></li>
              <li><strong>认真听完回应</strong><span>先复述对方观点，确认没有理解偏差，再表达自己的判断。</span></li>
              <li><strong>记录一次变化</strong><span>记下新的信息、不同意见和下一步行动；一周后回看是否真的做了调整。</span></li>
            </ol>
            <div className={styles.promptBox}><span>每周复盘</span><p>这周哪次交流改变了我的看法？我从谁那里得到帮助？我有没有给别人提供具体、诚实的回应？</p></div>
          </section>

          <section id="boundaries" className={styles.section}>
            <p className={styles.sectionIndex}>05 / BOUNDARIES</p>
            <h2>边界与局限</h2>
            <p>互动需要自愿、尊重和时间边界。独处、拒绝无效交流、暂停高消耗关系，都是合理的选择。面对冒犯或骚扰，结束接触比“继续互动”更重要。</p>
            <p>“更高的人生”是原始图像中的价值表达，不能推导为互动越多、人生就越成功。现实中的关系机会还受到工作、照护责任、健康和资源条件影响。这个框架适合自我观察和小范围实践，尚无可据此验证普遍因果效果的研究数据。</p>
          </section>
        </article>
      </div>

      <footer className={styles.footer}><span>大互动绿皮书 · v1.1 · 2026 年 10 月</span><a href="#plates">返回图版 ↑</a></footer>
    </PageContainer>
  )
}
