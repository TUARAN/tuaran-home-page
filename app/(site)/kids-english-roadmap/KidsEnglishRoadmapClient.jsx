'use client'

import {
  IconArrowUpRight,
  IconBook2,
  IconCheck,
  IconChevronDown,
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconDeviceTv,
  IconHeartHandshake,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
  IconVolume,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'

import styles from './kids-english-roadmap.module.css'
import { METHODS, SHOWS, SOURCES, STAGES, TODAY_PLAN, WEEK_PLAN, stageForMonths } from './data'

const STORAGE_KEY = 'kids-english-roadmap-week-v1'
const TABS = [
  { id: 'plan', label: '本周行动' },
  { id: 'stages', label: '年龄地图' },
  { id: 'shows', label: '动画片单' },
  { id: 'method', label: '方法与依据' },
]

function ageLabel(months) {
  const years = Math.floor(months / 12)
  const rest = months % 12
  return `${years} 岁${rest ? ` ${rest} 个月` : ''}`
}

function SectionHeading({ eyebrow, title, note }) {
  return (
    <div className={styles.sectionHeading}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {note ? <span>{note}</span> : null}
    </div>
  )
}

function StagePill({ stage, active, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.stagePill} ${active ? styles.stagePillActive : ''}`}
      style={{ '--stage-color': stage.color }}
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{stage.shortAge}</span>
      <strong>{stage.title.split(' · ')[0]}</strong>
    </button>
  )
}

export default function KidsEnglishRoadmapClient() {
  const [months, setMonths] = useState(21)
  const [activeTab, setActiveTab] = useState('plan')
  const [selectedStageId, setSelectedStageId] = useState('ready')
  const [showFilter, setShowFilter] = useState('ready')
  const [doneDays, setDoneDays] = useState([])
  const [copied, setCopied] = useState('')
  const [openMethod, setOpenMethod] = useState('serve-return')

  const currentStage = useMemo(() => stageForMonths(months), [months])
  const selectedStage = STAGES.find((stage) => stage.id === selectedStageId) || currentStage
  const filteredShows = SHOWS.filter((show) => show.stages.includes(showFilter))
  const doneCount = doneDays.length

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved)) setDoneDays(saved.filter((id) => WEEK_PLAN.some((item) => item.id === id)))
    } catch {
      // 本地记录不可用时仍可正常浏览。
    }
  }, [])

  useEffect(() => {
    setSelectedStageId(currentStage.id)
    setShowFilter(currentStage.id)
  }, [currentStage.id])

  function toggleDay(id) {
    setDoneDays((previous) => {
      const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // 忽略受限浏览器中的持久化失败。
      }
      return next
    })
  }

  async function copyLine(id, line) {
    try {
      await navigator.clipboard.writeText(line)
      setCopied(id)
      window.setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  function scrollToWorkbench(tab) {
    setActiveTab(tab)
    document.getElementById('roadmap-workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>FAMILY ENGLISH ROADMAP · 18–60 MONTHS</p>
          <h1>把英语放进孩子的生活，<br />从今天的 12 分钟开始。</h1>
          <p className={styles.lede}>
            这是一条从 <strong>1 岁 9 个月</strong> 起步、延伸到 5 岁的家庭路线。
            先看孩子是否愿意回应，再调整内容；不把单词量、字母书写和“开口速度”当作低龄阶段的考试。
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={() => scrollToWorkbench('plan')}>
              <IconPlayerPlay size={18} /> 看今天怎么做
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => scrollToWorkbench('stages')}>
              查看 2–5 岁路线
            </button>
          </div>
        </div>

        <aside className={styles.ageConsole} aria-label="按月龄调整建议">
          <div className={styles.consoleTop}>
            <span>孩子现在</span>
            <strong>{ageLabel(months)}</strong>
          </div>
          <input
            className={styles.range}
            type="range"
            min="18"
            max="60"
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            aria-label="孩子月龄"
          />
          <div className={styles.rangeTicks}><span>18个月</span><span>3岁</span><span>5岁</span></div>
          <div className={styles.stageNow} style={{ '--stage-color': currentStage.color }}>
            <span>当前建议</span>
            <h2>{currentStage.title}</h2>
            <p>{currentStage.summary}</p>
          </div>
          <div className={styles.guardrail}>
            <IconHeartHandshake size={19} />
            <p><strong>眼神、等待和回应</strong>比播放量更重要。21 个月可完全不靠屏幕启蒙。</p>
          </div>
        </aside>
      </section>

      <section className={styles.principleStrip} aria-label="三个核心原则">
        <div><span>01</span><strong>先互动</strong><p>孩子发出信号，大人及时回应。</p></div>
        <div><span>02</span><strong>少而重复</strong><p>一周用透 1 首歌、1 本书、3 组短句。</p></div>
        <div><span>03</span><strong>用进生活</strong><p>屏幕里的词，要回到吃饭、洗手和游戏。</p></div>
      </section>

      <section className={styles.workbench} id="roadmap-workbench">
        <nav className={styles.tabs} aria-label="学习路线视图">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.tabActive : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'plan' ? (
          <div className={styles.panel}>
            <SectionHeading
              eyebrow="START HERE · 21 MONTHS"
              title="今天先做一轮，不需要打开动画"
              note="每项约 4 分钟；孩子走开就结束，不把完成时长当任务。"
            />
            <div className={styles.todayGrid}>
              {TODAY_PLAN.map((item, index) => (
                <article className={styles.activityCard} key={item.id}>
                  <div className={styles.activityMeta}>
                    <span>0{index + 1}</span>
                    <span><IconClock size={15} /> {item.minutes} MIN</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.instruction}</p>
                  <button type="button" onClick={() => copyLine(item.id, item.line)}>
                    <span>{item.line}</span>
                    {copied === item.id ? <IconCheck size={17} /> : <IconCopy size={17} />}
                  </button>
                </article>
              ))}
            </div>

            <div className={styles.weekHeader}>
              <div>
                <p>7 DAY LOOP</p>
                <h3>第一周：每天只换一个生活主题</h3>
              </div>
              <div className={styles.progressText}><strong>{doneCount}</strong> / 7 天</div>
            </div>
            <div className={styles.progressTrack}><span style={{ width: `${(doneCount / 7) * 100}%` }} /></div>
            <div className={styles.weekList}>
              {WEEK_PLAN.map((item) => {
                const done = doneDays.includes(item.id)
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={done ? styles.dayDone : ''}
                    onClick={() => toggleDay(item.id)}
                    aria-pressed={done}
                  >
                    <span className={styles.checkCircle}>{done ? <IconCheck size={16} /> : null}</span>
                    <strong>{item.day}</strong>
                    <em>{item.theme}</em>
                    <p>{item.action}</p>
                  </button>
                )
              })}
            </div>
            <button type="button" className={styles.resetButton} onClick={() => {
              setDoneDays([])
              try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
            }}>
              <IconRefresh size={15} /> 重置本周记录
            </button>
          </div>
        ) : null}

        {activeTab === 'stages' ? (
          <div className={styles.panel}>
            <SectionHeading
              eyebrow="AGE MAP"
              title="按回应能力升级，不按生日自动跳级"
              note="年龄是入口；孩子持续表现出当前阶段的信号，再自然增加语言长度和任务难度。"
            />
            <div className={styles.stageSelector}>
              {STAGES.map((stage) => (
                <StagePill
                  key={stage.id}
                  stage={stage}
                  active={selectedStage.id === stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                />
              ))}
            </div>
            <article className={styles.stageDetail} style={{ '--stage-color': selectedStage.color }}>
              <div className={styles.stageLead}>
                <p>{selectedStage.shortAge}</p>
                <h3>{selectedStage.title}</h3>
                <span>{selectedStage.summary}</span>
              </div>
              <div className={styles.goalBlock}>
                <span>阶段目标</span>
                <p>{selectedStage.goal}</p>
                <strong><IconClock size={16} /> {selectedStage.minutes}</strong>
              </div>
              <div className={styles.detailColumn}>
                <span>把时间放在</span>
                <ul>{selectedStage.focus.map((item) => <li key={item}><IconCircleCheckFilled size={17} />{item}</li>)}</ul>
              </div>
              <div className={styles.detailColumn}>
                <span>暂时不用做</span>
                <ul>{selectedStage.avoid.map((item) => <li key={item}><span className={styles.minus}>—</span>{item}</li>)}</ul>
              </div>
              <div className={styles.signals}>
                <span>可以留意这些变化（不是考试）</span>
                <ol>{selectedStage.signals.map((item, index) => <li key={item}><b>0{index + 1}</b>{item}</li>)}</ol>
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === 'shows' ? (
          <div className={styles.panel}>
            <SectionHeading
              eyebrow="CURATED WATCHLIST"
              title="动画是可复用的素材，不是自动教学机"
              note="18–24 个月若引入屏幕，只选高质量短内容并全程共看；2–5 岁总屏幕时间仍需服从家庭健康安排。"
            />
            <div className={styles.filterBar}>
              <span><IconDeviceTv size={18} /> 适合阶段</span>
              {STAGES.map((stage) => (
                <button
                  type="button"
                  key={stage.id}
                  className={showFilter === stage.id ? styles.filterActive : ''}
                  onClick={() => setShowFilter(stage.id)}
                >
                  {stage.shortAge}
                </button>
              ))}
            </div>
            <div className={styles.showGrid}>
              {filteredShows.map((show) => (
                <article className={styles.showCard} key={show.id}>
                  <div className={styles.showTop}>
                    <span>{show.age}</span>
                    <span>{show.pace}节奏</span>
                  </div>
                  <h3>{show.name}</h3>
                  <p className={styles.showBest}>{show.best}</p>
                  <dl>
                    <div><dt>声音</dt><dd>{show.accent}</dd></div>
                    <div><dt>单次</dt><dd>{show.unit}</dd></div>
                  </dl>
                  <p>{show.why}</p>
                  <div className={styles.watchHow}><IconSparkles size={17} /><span><strong>怎么用：</strong>{show.how}</span></div>
                  <a href={show.link} target="_blank" rel="noreferrer">
                    官方信息 <IconArrowUpRight size={16} />
                  </a>
                </article>
              ))}
            </div>
            <div className={styles.screenRule}>
              <IconVolume size={22} />
              <div><strong>一段视频的完整用法</strong><p>看前说出 1 个目标词 → 共看时模仿 1 个动作 → 看后关屏复现 1 次。能迁移到真实生活，才算这段内容发挥了作用。</p></div>
            </div>
          </div>
        ) : null}

        {activeTab === 'method' ? (
          <div className={styles.panel}>
            <SectionHeading
              eyebrow="METHOD & EVIDENCE"
              title="家庭启蒙的四根支柱"
              note="这套路线综合回应式互动、多语发展、游戏化学习与儿童媒体健康建议。"
            />
            <div className={styles.methodLayout}>
              <div className={styles.methodList}>
                {METHODS.map((method, index) => {
                  const open = openMethod === method.id
                  return (
                    <button type="button" key={method.id} className={open ? styles.methodOpen : ''} onClick={() => setOpenMethod(method.id)}>
                      <span>0{index + 1}</span>
                      <div><em>{method.label}</em><strong>{method.title}</strong></div>
                      <IconChevronDown size={19} />
                    </button>
                  )
                })}
              </div>
              <article className={styles.methodDetail}>
                {METHODS.filter((method) => method.id === openMethod).map((method) => (
                  <div key={method.id}>
                    <p>{method.detail}</p>
                    <blockquote>{method.example}</blockquote>
                    <span>依据：{method.source}</span>
                  </div>
                ))}
              </article>
            </div>

            <div className={styles.cnAbroad}>
              <article>
                <span>国内学前教育经验</span>
                <h3>尊重发展节奏，用游戏和生活承载学习</h3>
                <p>教育部《3–6 岁儿童学习与发展指南》强调珍视游戏和生活的独特价值，并反对提前学习小学内容。用于家庭英语时，意味着少做纸笔训练，多做真实交流、身体活动和共同阅读。</p>
              </article>
              <article>
                <span>国际语言与发展经验</span>
                <h3>高质量互动和可理解输入，比资源数量重要</h3>
                <p>哈佛儿童发展中心、ASHA、British Council 的共同指向是：成人回应、共同注意、唱读玩和稳定练习，构成低龄语言学习的核心环境。</p>
              </article>
            </div>

            <div className={styles.sources}>
              <div className={styles.sourcesTitle}><IconBook2 size={21} /><h3>依据与延伸阅读</h3></div>
              {SOURCES.map((source, index) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div><strong>{source.name}</strong><p>{source.note}</p></div>
                  <IconArrowUpRight size={17} />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <footer className={styles.footerNote}>
        <p>这是一份家庭学习建议，不替代儿科、听力或言语语言专业评估。</p>
        <p>如果孩子在所有语言中都很少回应声音、很少使用手势沟通，或出现已掌握能力倒退，请尽早咨询儿科医生或言语语言专业人员。</p>
      </footer>
    </main>
  )
}
