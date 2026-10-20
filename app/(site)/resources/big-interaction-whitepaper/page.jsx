import Image from 'next/image'
import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import styles from './whitepaper.module.css'

export const dynamic = 'force-static'

const path = '/resources/big-interaction-whitepaper'
const url = `https://2aran.com${path}`
const shareUrl = 'https://2aran.com/x'
const title = '大互动理论白皮书'
const description = '从照顾身体，到通过真实互动认识自己、拓展边界：大互动理论的概念、实践路径、互动质量框架与适用边界。'

export const metadata = {
  title: `${title}｜从封闭走向真实互动`,
  description,
  keywords: ['大互动理论', '大互动白皮书', '真实互动', '反馈', '自我成长', '社交关系'],
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
  ['plates', '附录 · 原始图版'],
]

const dimensions = [
  { number: '01', title: '互动次数', question: '是否有足够的接触机会？', detail: '记录接触频率，但不把频率直接等同于关系质量。' },
  { number: '02', title: '互动深度', question: '是否交换了真实的想法？', detail: '留意讨论是否超越礼貌寒暄，容纳具体经历和不同意见。' },
  { number: '03', title: '互动对象', question: '是否接触到不同视角？', detail: '与同频伙伴建立长期关系，也给跨领域、跨经验的交流留空间。' },
  { number: '04', title: '内容价值', question: '是否带来启发或共鸣？', detail: '观察交流是否提供事实、方法、问题或情感支持。' },
  { number: '05', title: '互动持续性', question: '是否能在时间中积累？', detail: '关注稳定回应与后续行动，而非一次热闹的瞬间。' },
]

const plates = [
  { src: '/resources/big-interaction-whitepaper/04.jpg', width: 1122, height: 1402, title: '图版一 · 三层递进', caption: '从睡眠与饮水的基础照顾，走向互动中的自我认识。' },
  { src: '/resources/big-interaction-whitepaper/02.jpg', width: 688, height: 1024, title: '图版二 · 走出封闭', caption: '以探索者的叙事呈现走出封闭、真诚互动与持续修正。' },
  { src: '/resources/big-interaction-whitepaper/03.jpg', width: 941, height: 1656, title: '图版三 · 行动循环', caption: '呈现理解边界、主动行动、获得反馈和修正行为的循环；下半部包含原图中的图书推广信息。' },
  { src: '/resources/big-interaction-whitepaper/01.jpg', width: 1024, height: 1516, title: '图版四 · 互动质量', caption: '把关注和互动分解为次数、深度、对象、内容价值与持续性。' },
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
          <div className={styles.eyebrow}><Link href="/articles?group=resource">资源</Link><span>/</span><span>理念白皮书 · 2026.10</span></div>
          <p className={styles.kicker}>THE BIG INTERACTION THEORY</p>
          <h1>大互动<span>理论</span><small>白皮书</small></h1>
          <p className={styles.heroLead}>从好好照顾自己，<br />到在互动中认识自己。</p>
          <p className={styles.heroDescription}>通过真实交流获得新的视角，通过反馈调整行动。更广阔的生活，始于一次愿意走出去的互动。</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#abstract">阅读白皮书 <span aria-hidden="true">↗</span></a>
            <SharePageButton title={title} text={description} url={shareUrl} exactUrl shorten={false} size="md" idleLabel="分享白皮书" />
          </div>
        </div>
        <div className={styles.heroArt}>
          <Image src="/resources/big-interaction-whitepaper/04.jpg" alt="大互动理论原始图版：睡眠、水与互动的三层递进" width={1122} height={1402} priority sizes="(max-width: 760px) 90vw, 340px" />
          <span className={styles.heroArtLabel}>原始视觉概念 / 04</span>
        </div>
      </header>

      <div className={styles.readingGrid}>
        <aside className={styles.toc} aria-label="白皮书目录">
          <p>目录 <span>CONTENTS</span></p>
          <nav>{chapters.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
          <span className={styles.tocMeta}>v1.0 · TUARAN</span>
        </aside>

        <article className={styles.paper}>
          <section id="abstract" className={styles.section}>
            <p className={styles.sectionIndex}>ABSTRACT</p>
            <h2>摘要</h2>
            <p className={styles.lead}>大互动理论是一套关于个人成长与关系质量的实践框架。它主张：在基本的身体照顾之上，主动进入真实的交流场景，接触差异，收集反馈，并据此修正自己的理解与行动。</p>
            <p>“大互动”强调互动的范围、深度和持续性。它不要求无限扩大社交圈，也不鼓励以互动数量衡量人的价值。与更多人说话只是起点；能否互相理解、建立信任、形成行动上的改变，才决定互动是否有意义。</p>
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

      <section id="plates" className={styles.plates}>
        <div className={styles.platesHeader}><div><p className={styles.sectionIndex}>APPENDIX / VISUAL ARCHIVE</p><h2>原始图版</h2></div><p>四张提供的图片完整保留。图片文字属于原始视觉表达，以上白皮书正文为整理后的可阅读版本。</p></div>
        <div className={styles.plateGrid}>{plates.map((plate) => <figure key={plate.src} className={styles.plate}><a href={plate.src} target="_blank" rel="noopener noreferrer" aria-label={`查看${plate.title}原图`}><Image src={plate.src} width={plate.width} height={plate.height} alt={`${plate.title}：${plate.caption}`} sizes="(max-width: 640px) 90vw, (max-width: 900px) 45vw, 25vw" /></a><figcaption><strong>{plate.title}</strong><span>{plate.caption}</span></figcaption></figure>)}</div>
      </section>

      <footer className={styles.footer}><span>大互动理论白皮书 · v1.0 · 2026 年 10 月</span><a href="#abstract">返回顶部 ↑</a></footer>
    </PageContainer>
  )
}
