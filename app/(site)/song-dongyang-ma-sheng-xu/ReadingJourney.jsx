'use client'

import { useEffect, useState } from 'react'
import styles from './reading-journey.module.css'

const STORAGE_KEY = 'song-dongyang-reading-v1'

const chapters = [
  {
    number: '01',
    place: '藏书之家',
    title: '借来一本书',
    subtitle: '书很难得到，约定的归期却不会等人。',
    quote: '手自笔录，计日以还。',
    translation: '宋濂向有书的人家借书，亲手抄录，算好日子按时归还。天寒到砚台结冰，他仍没有停下。守约让他获得继续借书的机会。',
    words: [
      { term: '假借', meaning: '借。这里指向藏书的人家借书。' },
      { term: '走', meaning: '跑。古今意义不同。' },
      { term: '逾约', meaning: '超过约定的期限。' },
    ],
    question: '别人后来愿意继续借书给宋濂，关键原因是什么？',
    choices: ['他抄书很快', '他按时归还借来的书', '他认识很多老师'],
    answer: 1,
    explanation: '“录毕，走送之，不敢稍逾约”，接着才有“人多以书假余”。',
    takeaway: '求知从一本借来的书开始，也从守信开始。',
  },
  {
    number: '02',
    place: '先达门前',
    title: '带着疑问去请教',
    subtitle: '书读得越多，越知道还要向人求教。',
    quote: '援疑质理，俯身倾耳以请。',
    translation: '成年后，宋濂走到百里之外，拿着经书向有学问的前辈请教。他提出疑问、追问道理，等待适当时机继续发问。',
    words: [
      { term: '加冠', meaning: '古代男子二十岁行冠礼，这里指成年。' },
      { term: '先达', meaning: '有名望、有学问的前辈。' },
      { term: '俟', meaning: '等待。' },
    ],
    question: '“援疑质理”更接近下面哪种学习方式？',
    choices: ['把不懂的地方拿出来追问', '只把答案背下来', '避开难题，等老师讲解'],
    answer: 0,
    explanation: '“援疑”是提出疑难，“质理”是询问道理。',
    takeaway: '认真提问，是主动学习的一部分。',
  },
  {
    number: '03',
    place: '深山逆旅',
    title: '在风雪里赶路',
    subtitle: '求学的路，也有寒冷、饥饿与比较。',
    quote: '以中有足乐者，不知口体之奉不若人也。',
    translation: '他背着书箱穿过山谷，脚冻裂，住在旅店时饭食简朴。同行的人衣饰华美；他把注意力放在自己从学习中得到的乐趣上。',
    words: [
      { term: '负箧曳屣', meaning: '背着书箱，拖着鞋子。' },
      { term: '逆旅', meaning: '旅店。' },
      { term: '容臭', meaning: '香袋；“臭”在这里指气味。' },
    ],
    question: '宋濂写同舍生的华美衣饰，是为了突出什么？',
    choices: ['同舍生不爱学习', '自己因求学之乐而不慕衣食', '旅店生活十分富足'],
    answer: 1,
    explanation: '对照之后，文章落在“中有足乐者”：他有更看重的事情。',
    takeaway: '物质条件的差异真实存在，内心的志趣也影响人的选择。',
  },
  {
    number: '04',
    place: '赠别之际',
    title: '把经历讲给马生',
    subtitle: '回望艰难，是为了劝勉眼前的年轻人。',
    quote: '余故道为学之难以告之。',
    translation: '太学生有书、有老师，也有稳定的衣食条件。宋濂将自己的经历讲给即将归乡的马生，提醒他珍惜求学机会，专心学习。',
    words: [
      { term: '太学', meaning: '古代的最高学府。' },
      { term: '贽', meaning: '初次拜见尊长时所献的礼物；文中是长信。' },
      { term: '夷', meaning: '平和。这里形容神色。' },
    ],
    question: '这篇赠序最终写给谁？',
    choices: ['藏书的人家', '太学的所有老师', '东阳马生君则'],
    answer: 2,
    explanation: '末段点明“东阳马生君则”，并交代他将归见亲人。',
    takeaway: '经历成为赠言，重点落在怎样使用眼前的学习条件。',
  },
]

const fullText = [
  {
    title: '借书与求师',
    original: '余幼时即嗜学。家贫，无从致书以观，每假借于藏书之家，手自笔录，计日以还。天大寒，砚冰坚，手指不可屈伸，弗之怠。录毕，走送之，不敢稍逾约。以是人多以书假余，余因得遍观群书。既加冠，益慕圣贤之道，又患无硕师名人与游，尝趋百里外，从乡之先达执经叩问。先达德隆望尊，门人弟子填其室，未尝稍降辞色。余立侍左右，援疑质理，俯身倾耳以请；或遇其叱咄，色愈恭，礼愈至，不敢出一言以复；俟其欣悦，则又请焉。故余虽愚，卒获有所闻。',
    meaning: '我小时候就爱读书。家里贫穷，没办法买书，常向有藏书的人家借来，亲手抄写，算好日期归还。天气极冷时，砚台里的墨结了冰，手指冻得不能屈伸，我也没有懈怠。抄完便赶紧送还，从不稍稍超过约定期限。因此许多人愿意把书借给我，我才得以广泛读书。成年后，我更加向往圣贤的学问，又担心没有学问渊博的老师可以请教，曾走到百里之外，拿着经书向当地有学问的前辈求教。前辈德高望重，学生挤满屋子，他说话和神色从不稍加缓和。我站在旁边，提出疑问、请教道理，弯着身子侧耳倾听；有时遭到训斥，我的态度更加恭敬，礼节更加周到，不敢回一句话；等他高兴时，再继续请教。所以我虽然愚钝，最终还是学到了一些东西。',
  },
  {
    title: '远行与自守',
    original: '当余之从师也，尝负箧曳屣，行深山巨谷中。穷冬烈风，大雪深数尺，足肤皲裂而不知。至舍，四支僵劲不能动，媵人持汤沃灌，以衾拥覆，久而乃和。寓逆旅，主人日再食，无鲜肥滋味之享。同舍生皆被绮绣，戴珠缨宝饰之帽，腰白玉之环，左佩刀，右备容臭，烨然若神人。余则缊袍敝衣处其间，略无慕艳意。以中有足乐者，不知口体之奉不若人也。盖余之勤且艰若此。今虽耄老，未有所成，犹幸预君子之列，而承天子之宠光，缀公卿之后，日侍坐备顾问，四海亦谬称其氏名，况才之过于余者乎？',
    meaning: '我从师学习时，曾背着书箱、拖着鞋，走在深山大谷之中。隆冬寒风猛烈，积雪深达数尺，脚上的皮肤冻裂了也不知道。到了住处，四肢僵硬得动弹不得，服侍的人拿热水浇洗，用被子裹住我，过了很久才暖和。住在旅店里，店主人每天供给两顿饭，没有新鲜肥美的食物。同住的学生穿着华丽衣服，戴着饰有珠宝的帽子，腰间挂着白玉环，左边佩刀，右边挂香袋，光彩照人，仿佛神仙。我穿着旧棉袍和破衣服站在他们中间，丝毫没有羡慕的意思，因为心里有足以让我快乐的事，便不觉得吃穿比不上别人。我的勤奋与艰难大致就是这样。如今我虽然年老，没有什么成就，仍有幸列于官员之中，受到天子的恩宠，跟随公卿之后，每天在旁侍候、接受问询，天下的人也不恰当地称道我的名字；才华胜过我的人，更不必说了。',
  },
  {
    title: '太学的条件',
    original: '今诸生学于太学，县官日有廪稍之供，父母岁有裘葛之遗，无冻馁之患矣；坐大厦之下而诵《诗》《书》，无奔走之劳矣；有司业、博士为之师，未有问而不告、求而不得者也；凡所宜有之书，皆集于此，不必若余之手录、假诸人而后见也。其业有不精、德有不成者，非天质之卑，则心不若余之专耳，岂他人之过哉！',
    meaning: '如今学生们在太学读书，朝廷每天供给粮食，父母每年送来冬夏衣服，不用担心受冻挨饿；坐在宽大的屋子里诵读经书，不必奔波；有司业、博士做老师，提问可以得到回答，请教可以得到帮助；需要的书都集中在这里，不必像我那样亲手抄写、向别人借阅。如果学业仍不精进、品德仍未养成，除非是天资不足，否则便是用心不如我专一，怎么能归咎于别人呢？',
  },
  {
    title: '送给马生的话',
    original: '东阳马生君则，在太学已二年，流辈甚称其贤。余朝京师，生以乡人子谒余，撰长书以为贽，辞甚畅达；与之论辩，言和而色夷。自谓少时用心于学甚劳，是可谓善学者矣。其将归见其亲也，余故道为学之难以告之。谓余勉乡人以学者，余之志也；诋我夸际遇之盛而骄乡人者，岂知予者哉！',
    meaning: '东阳的马君则在太学学习已两年，同辈人都很称赞他的品行。我到京城朝见天子时，他以同乡晚辈的身份来拜见我，写了一封长信作为见面礼，文辞流畅通达；同他讨论问题，他说话温和、神色平静。他说自己年少时学习十分用功，确实可以称得上善于学习。他将要回乡探望父母，所以我把求学的困难讲给他听。说我是在勉励同乡后辈学习，这是我的本意；若说我是在夸耀自己如今的际遇、对同乡后辈摆架子，那就不了解我了。',
  },
]

export default function ReadingJourney() {
  const [active, setActive] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedWord, setSelectedWord] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      if (Number.isInteger(saved.active) && saved.active >= 0 && saved.active < chapters.length) setActive(saved.active)
      if (saved.answers && typeof saved.answers === 'object') setAnswers(saved.answers)
    } catch {
      // Reading remains available when storage is disabled or stale.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, answers }))
    } catch {
      // Progress is optional.
    }
  }, [active, answers, loaded])

  const chapter = chapters[active]
  const currentAnswer = answers[active]
  const completeCount = chapters.filter((_, index) => answers[index] === chapters[index].answer).length

  function goTo(index) {
    setActive(index)
    setSelectedWord(null)
  }

  function reset() {
    setActive(0)
    setAnswers({})
    setSelectedWord(null)
  }

  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <section className={styles.hero} aria-labelledby="page-title">
        <div className={styles.heroInk} aria-hidden="true"><span>学</span></div>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> 明 · 宋濂 <span className={styles.eyebrowLine} /></div>
          <h1 id="page-title">送东阳<br /><em>马生序</em></h1>
          <p className={styles.heroDescription}>一封写给年轻人的赠言，一段从借书、求师到远行的求学记忆。循着四处场景，读懂宋濂为何讲述自己的艰难。</p>
          <div className={styles.heroActions}>
            <a href="#journey" className={styles.primaryAction}>开始阅读 <span aria-hidden="true">↘</span></a>
            <a href="#full-text" className={styles.textAction}>原文与释义 <span aria-hidden="true">↘</span></a>
          </div>
        </div>
        <div className={styles.heroSide} aria-hidden="true"><span>卷</span><span>一</span><i /></div>
        <div className={styles.heroFooter}><span>一卷书 · 百里路 · 一份赠言</span><span>向下探索 ↓</span></div>
      </section>

      <section id="journey" className={styles.journey} aria-labelledby="journey-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.sectionKicker}>READING JOURNEY / 01—04</span><h2 id="journey-title">沿着他的求学路</h2></div>
          <div className={styles.progressSummary}><strong>{String(completeCount).padStart(2, '0')}<small> / 04</small></strong><span>道理解锁</span></div>
        </div>
        <div className={styles.layout}>
          <nav className={styles.chapterNav} aria-label="阅读章节">
            <div className={styles.navCaption}>四站 · 自由探索</div>
            {chapters.map((item, index) => (
              <button key={item.number} type="button" onClick={() => goTo(index)} className={`${styles.navItem} ${active === index ? styles.navItemActive : ''}`} aria-current={active === index ? 'step' : undefined}>
                <span className={styles.navNumber}>{item.number}</span>
                <span className={styles.navText}><strong>{item.place}</strong><small>{item.title}</small></span>
                <span className={styles.navStatus} aria-label={answers[index] === item.answer ? '已答对' : undefined}>{answers[index] === item.answer ? '✓' : '↗'}</span>
              </button>
            ))}
            <div className={styles.navBottom}>读一段 · 想一想 · 再前行</div>
          </nav>

          <article className={styles.chapterCard} key={active}>
            <div className={styles.cardTop}><span>第 {chapter.number} 站 / {chapter.place}</span><span>SONG LIAN’S JOURNEY</span></div>
            <h3>{chapter.title}</h3>
            <p className={styles.chapterSubtitle}>{chapter.subtitle}</p>
            <div className={styles.quoteBox}><span className={styles.quoteLabel}>原文 · 关键句</span><blockquote>{chapter.quote}</blockquote><span className={styles.quoteOrnament} aria-hidden="true">〝</span></div>
            <div className={styles.explanation}><span className={styles.detailLabel}>读懂这一站</span><p>{chapter.translation}</p><a className={styles.fullTextJump} href={`#text-${active + 1}`}>查看本段完整原文与释义 ↘</a></div>
            <div className={styles.words}>
              <span className={styles.detailLabel}>点读词语</span>
              <div className={styles.wordButtons}>{chapter.words.map((word, index) => <button type="button" key={word.term} className={selectedWord === index ? styles.wordActive : ''} onClick={() => setSelectedWord(selectedWord === index ? null : index)} aria-expanded={selectedWord === index}>{word.term}<span aria-hidden="true">＋</span></button>)}</div>
              {selectedWord !== null && <p className={styles.wordMeaning}><strong>{chapter.words[selectedWord].term}</strong>{chapter.words[selectedWord].meaning}</p>}
            </div>
            <div className={styles.cardFooter}><span>{chapter.number} / 04</span><div className={styles.cardControls}><button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0}>← 上一站</button><button type="button" onClick={() => goTo(Math.min(chapters.length - 1, active + 1))} disabled={active === chapters.length - 1}>下一站 →</button></div></div>
          </article>

          <aside className={styles.challenge} aria-labelledby="challenge-title">
            <div className={styles.challengeBadge}>思考片刻 <span>✳</span></div>
            <h3 id="challenge-title">读完这段，<br />你怎么想？</h3>
            <p className={styles.question}>{chapter.question}</p>
            <div className={styles.choices}>{chapter.choices.map((choice, index) => {
              const answered = currentAnswer !== undefined
              const isCorrect = index === chapter.answer
              return <button key={choice} type="button" disabled={answered} onClick={() => setAnswers(previous => ({ ...previous, [active]: index }))} className={`${styles.choice} ${answered && isCorrect ? styles.choiceCorrect : ''} ${answered && currentAnswer === index && !isCorrect ? styles.choiceWrong : ''}`}><span className={styles.choiceLetter}>{String.fromCharCode(65 + index)}</span><span>{choice}</span><span className={styles.choiceSymbol}>{answered && isCorrect ? '✓' : answered && currentAnswer === index ? '×' : '○'}</span></button>
            })}</div>
            {currentAnswer !== undefined && <div className={styles.feedback} role="status"><strong>{currentAnswer === chapter.answer ? '答对了。' : '再看一眼原文。'}</strong><p>{chapter.explanation}</p><p className={styles.takeaway}>{chapter.takeaway}</p></div>}
            {currentAnswer !== undefined && <button type="button" className={styles.retry} onClick={() => setAnswers(previous => { const next = { ...previous }; delete next[active]; return next })}>重新作答 ↺</button>}
          </aside>
        </div>
      </section>

      <section id="full-text" className={styles.fullText} aria-labelledby="full-text-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.sectionKicker}>ORIGINAL TEXT & INTERPRETATION</span><h2 id="full-text-title">原文与释义</h2></div>
          <span className={styles.fullTextHint}>逐段对照 · 全文阅读</span>
        </div>
        <div className={styles.fullTextList}>{fullText.map((part, index) => (
          <article className={styles.fullTextPart} id={`text-${index + 1}`} key={part.title}>
            <div className={styles.fullTextPartHeading}><span>{String(index + 1).padStart(2, '0')}</span><h3>{part.title}</h3></div>
            <div className={styles.fullTextColumns}>
              <div><span className={styles.fullTextLabel}>原文</span><p className={styles.originalText}>{part.original}</p></div>
              <div><span className={styles.fullTextLabel}>现代汉语释义</span><p className={styles.meaningText}>{part.meaning}</p></div>
            </div>
          </article>
        ))}</div>
        <p className={styles.sourceNote}>原文据维基文库《明文海》收录版本核对；释义为本站编写，便于对照理解。</p>
      </section>

      <section className={styles.closing}>
        <div className={styles.closingStamp} aria-hidden="true">勤<br />且<br />艰</div>
        <div><span className={styles.sectionKicker}>BEYOND THE TEXT</span><h2>读到最后，<br />再想想今天。</h2><p>书和老师比过去更容易接近。真正值得带走的问题是：你会怎样使用已经拥有的学习条件？</p></div>
        <div className={styles.closingActions}><a href="#full-text">阅读原文与释义 <span>↗</span></a><button type="button" onClick={reset}>从第一站重读 <span>↺</span></button></div>
      </section>
      <footer className={styles.footer}><span>《送东阳马生序》 · 宋濂</span><a href="https://zh.wikisource.org/zh-hans/%E9%80%81%E6%9D%B1%E9%99%BD%E9%A6%AC%E7%94%9F%E5%BA%8F" target="_blank" rel="noopener noreferrer">原文出处：维基文库 ↗</a></footer>
    </main>
  )
}
