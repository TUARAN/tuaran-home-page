'use client'

import { useState } from 'react'

const R2_MEDIA_BASE = 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev'
const VIDEO_SRC = `${R2_MEDIA_BASE}/resources/niu-lai/niu-lai-full-2026.mp4`

const reviewSteps = [
  {
    id: 'filing',
    label: '剧本备案',
    eyebrow: '2021',
    title: '先确认题材与故事可以拍摄',
    text: '公开信息显示，《牛来》的备案编号为影动备字〔2021〕第104号。备案解决的是项目能否进入摄制流程，不评价最终画面的精细程度。',
  },
  {
    id: 'content',
    label: '内容审查',
    eyebrow: '内容门槛',
    title: '审查影片是否触碰内容红线',
    text: '影片围绕小牛成长展开。只要内容符合现行规定、材料和手续完整，制作粗糙本身通常不会构成内容审查不通过的理由。',
  },
  {
    id: 'technical',
    label: '技术审查',
    eyebrow: '放映门槛',
    title: '确认影片能够安全、稳定地放映',
    text: '技术审查关注坏帧、音画不同步、长时间黑屏、解码故障等问题。建模精度、动作美感和镜头品位属于作品质量评价。',
  },
  {
    id: 'license',
    label: '公映许可',
    eyebrow: '2024',
    title: '取得龙标后进入院线发行',
    text: '公开报道所列公映许可证为电审动字〔2024〕第33号。它证明影片具备公映资格，不等于主管部门为艺术水准或商业价值背书。',
  },
]

const questions = [
  {
    title: '背后到底是谁在审批？',
    answer: '电影备案与公映许可属于国家电影主管部门的行政流程。现有公开材料能确认备案号和公映许可证号，不能据此指向某位具体审批人员，也没有证据显示《牛来》通过了特殊通道。',
  },
  {
    title: '画面这么粗糙，为什么还能拿到龙标？',
    answer: '龙标对应合法公映资格。审查规则关注内容合规、申报手续和放映技术指标，没有设置“建模必须精细”或“观众必须觉得好看”的审美门槛。',
  },
  {
    title: '洗钱、套补贴的说法成立吗？',
    answer: '截至 2026 年 8 月 17 日，没有公开证据证明《牛来》涉及洗钱，也暂未查到该片申报或获得辽宁电影奖励的公示记录。政策存在不等于项目已经申领，讨论时需要区分事实、推测与玩梗。',
  },
]

export function NiuLaiVideoPlayer() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/15 bg-[#090c0a] shadow-2xl shadow-black/25" aria-label="《牛来》原片播放器">
      <div className="relative aspect-[20/9] min-h-[220px] w-full bg-black sm:min-h-[360px] lg:min-h-[430px]">
        <video
          src={VIDEO_SRC}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full bg-black object-contain"
          aria-label="《牛来》电影原片"
        >
          你的浏览器不支持 HTML5 视频播放。
        </video>
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] text-white/75 backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]">
          原片画质 · 86:51
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] text-white/75 backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]">
          大智提供
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#101411] px-3 py-3 sm:px-4">
        <p className="px-1 text-[11px] leading-5 text-white/45">完整原片保持 1920×864 画面与原始码率，支持在 86 分 51 秒的完整时间轴上直接拖动；播放器只预载媒体信息，不会主动下载整部影片。</p>
      </div>
    </section>
  )
}

export default function NiuLaiInteractive() {
  const [activeStep, setActiveStep] = useState('filing')
  const [openQuestion, setOpenQuestion] = useState(0)
  const active = reviewSteps.find((step) => step.id === activeStep) || reviewSteps[0]

  return (
    <>
      <section className="mt-12" aria-labelledby="review-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#867447] dark:text-amber-300/80">Review Path</p>
        <h2 id="review-heading" className="mt-2 font-serif text-2xl font-semibold text-[var(--site-ink)] md:text-3xl">一张龙标，经过哪些环节？</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--site-muted)]">点击四个环节，查看“允许公映”和“制作精良”为什么不能画上等号。</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1" role="tablist" aria-label="电影审查流程">
            {reviewSteps.map((step, index) => {
              const selected = step.id === activeStep
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveStep(step.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${selected ? 'border-[#263a2d] bg-[#263a2d] text-white shadow-sm dark:border-emerald-300 dark:bg-emerald-300 dark:text-gray-950' : 'border-[#dedbd2] bg-white/70 text-[#555] hover:border-[#9f977f] dark:border-gray-800 dark:bg-gray-950/45 dark:text-gray-300'}`}
                >
                  <span className={`mr-2 font-mono text-[10px] ${selected ? 'text-white/55 dark:text-black/50' : 'text-[#a08d5f]'}`}>0{index + 1}</span>
                  {step.label}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" className="min-h-[250px] rounded-3xl border border-[#dedbd2] bg-[linear-gradient(135deg,#fbfaf6,#f1f3ec)] p-6 dark:border-gray-800 dark:bg-[linear-gradient(135deg,#171916,#101210)] md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a7440] dark:text-amber-300">{active.eyebrow}</p>
            <h3 className="mt-3 max-w-2xl font-serif text-2xl font-semibold leading-snug text-[var(--site-ink)]">{active.title}</h3>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--site-muted)] md:text-base">{active.text}</p>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="questions-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#867447] dark:text-amber-300/80">Questions</p>
        <h2 id="questions-heading" className="mt-2 font-serif text-2xl font-semibold text-[var(--site-ink)] md:text-3xl">争议问题，公开信息能回答到哪里？</h2>
        <div className="mt-5 divide-y divide-[#dedbd2] overflow-hidden rounded-3xl border border-[#dedbd2] bg-white/60 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950/35">
          {questions.map((item, index) => {
            const open = openQuestion === index
            return (
              <div key={item.title}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenQuestion(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-sm font-semibold text-[var(--site-ink)] md:px-7 md:text-base"
                >
                  {item.title}
                  <span className={`text-xl font-light transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true">＋</span>
                </button>
                {open ? <p className="max-w-4xl px-5 pb-6 text-sm leading-7 text-[var(--site-muted)] md:px-7">{item.answer}</p> : null}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
