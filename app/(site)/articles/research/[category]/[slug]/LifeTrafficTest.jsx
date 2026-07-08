'use client'

import { useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconChartBar,
  IconChevronLeft,
  IconRefresh,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react'

const questions = [
  {
    id: 'recognized',
    label: '识别 UV',
    title: '现在大概有多少人能认出你，或听到名字知道是谁？',
    hint: '不算路上擦肩和完全想不起你的曝光。',
    options: [
      { label: '<300', value: 220 },
      { label: '300-1000', value: 700 },
      { label: '1000-3000', value: 1800 },
      { label: '>3000', value: 4600 },
    ],
  },
  {
    id: 'active',
    label: '活跃 UV',
    title: '过去一年，你和多少人有过真实互动？',
    hint: '聊天、见面、合作、请托、认真问候都算。',
    options: [
      { label: '<20', value: 14 },
      { label: '20-60', value: 42 },
      { label: '60-150', value: 105 },
      { label: '150+', value: 220 },
    ],
  },
  {
    id: 'care',
    label: '关注 UV',
    title: '你遇到大事时，会主动关心你的人有多少？',
    hint: '搬家、生病、换工作、低谷、结婚这类节点。',
    options: [
      { label: '0-5', value: 4 },
      { label: '6-15', value: 11 },
      { label: '16-40', value: 28 },
      { label: '40+', value: 64 },
    ],
  },
  {
    id: 'reply',
    label: '复访 PV',
    title: '你发一条重要近况，会认真看完并回复的人有多少？',
    hint: '不是礼貌点赞，而是愿意停下来回应。',
    options: [
      { label: '0-5', value: 3 },
      { label: '6-20', value: 13 },
      { label: '21-80', value: 48 },
      { label: '80+', value: 125 },
    ],
  },
  {
    id: 'online',
    label: '线上增量',
    title: '你在线上有多少稳定读者、关注者或职业主页受众？',
    hint: '朋友圈、公众号、X、小红书、GitHub、个人站都可以粗略折算。',
    options: [
      { label: '<100', value: 35 },
      { label: '100-1000', value: 280 },
      { label: '1000-1 万', value: 1800 },
      { label: '>1 万', value: 8600 },
    ],
  },
  {
    id: 'opportunity',
    label: '高价值 UV',
    title: '过去一年，有多少人给你带来过机会、信息、客户、合作或转介绍？',
    hint: '这里衡量的是会行动的相关人，不是“看起来厉害”的人。',
    options: [
      { label: '0', value: 0 },
      { label: '1-3', value: 2 },
      { label: '4-10', value: 7 },
      { label: '10+', value: 18 },
    ],
  },
]

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function formatNumber(n) {
  const value = Math.round(Number(n) || 0)
  return value.toLocaleString('zh-CN')
}

function formatRange(low, high, suffix = '') {
  return `${formatNumber(low)}-${formatNumber(high)}${suffix}`
}

function getLevel(score, recognitionUv) {
  if (recognitionUv >= 10000 || score >= 86) {
    return {
      code: 'A3',
      name: '垂直知名型',
      text: '你已经不只是熟人网络里的节点，更像某个圈层里会被反复想起的人。',
    }
  }
  if (recognitionUv >= 2000 || score >= 70) {
    return {
      code: 'A2',
      name: '本地/圈层强节点',
      text: '你的识别 UV 已经高于普通中位数，关键在于把被看见转成被信任。',
    }
  }
  if (score >= 42) {
    return {
      code: 'A1',
      name: '普通高留存型',
      text: '你的流量更像私域产品：总 UV 不夸张，但少数人会反复打开你。',
    }
  }
  return {
    code: 'A0',
    name: '低曝光安静型',
    text: '你的有效流量半径较小，但如果核心关系稳定，人生停留时长仍然可能很高。',
  }
}

function calculateResult(answers) {
  const recognized = answers.recognized || 0
  const active = answers.active || 0
  const care = answers.care || 0
  const reply = answers.reply || 0
  const online = answers.online || 0
  const opportunity = answers.opportunity || 0

  const recognitionUv = Math.round(Math.max(recognized, active * 5, online * 0.45))
  const activeUv = Math.round(Math.max(active, reply * 1.4, care * 2))
  const attentionUv = Math.round(Math.max(care, reply * 0.62))
  const actionUv = Math.round(Math.max(opportunity, care * 0.42, reply * 0.2))
  const highValueUv = Math.round(Math.max(opportunity, actionUv * 0.7))
  const effectivePv = Math.round(activeUv * 115 + attentionUv * 680 + actionUv * 360 + online * 18 + 12000)
  const lowPv = Math.round(effectivePv * 0.68)
  const highPv = Math.round(effectivePv * 1.42)
  const stayHours = Math.round((attentionUv * 220 + activeUv * 20 + highValueUv * 32 + 3800) * 0.92)
  const score = clamp(
    Math.round(
      Math.log10(recognitionUv + 10) * 14 +
        Math.log10(activeUv + 10) * 12 +
        Math.log10(attentionUv + 5) * 15 +
        Math.log10(actionUv + 3) * 18 +
        Math.log10(online + 10) * 5,
    ),
    0,
    99,
  )
  const level = getLevel(score, recognitionUv)

  return {
    recognitionUv,
    activeUv,
    attentionUv,
    actionUv,
    highValueUv,
    lowPv,
    highPv,
    stayLow: Math.round(stayHours * 0.68),
    stayHigh: Math.round(stayHours * 1.35),
    score,
    level,
  }
}

export default function LifeTrafficTest() {
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[current]
  const isComplete = answeredCount === questions.length
  const result = useMemo(() => (isComplete ? calculateResult(answers) : null), [answers, isComplete])
  const progress = Math.round((answeredCount / questions.length) * 100)

  function choose(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (current < questions.length - 1) {
      window.setTimeout(() => setCurrent((index) => Math.min(index + 1, questions.length - 1)), 120)
    }
  }

  function reset() {
    setAnswers({})
    setCurrent(0)
  }

  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border border-[#d8ddd6] bg-[#f7f8f2] text-[#20231f] shadow-sm dark:border-[#28313a] dark:bg-[#101820] dark:text-gray-100">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-[#d8ddd6] bg-[#e8efe9] p-5 dark:border-[#28313a] dark:bg-[#131f22] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#58706b] dark:text-[#98b9b0]">
            <IconSparkles size={16} stroke={1.8} />
            Life traffic test
          </div>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight text-[#1c261f] dark:text-gray-50 sm:text-3xl">
            测一测你当前的人生 PV / UV
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5c655e] dark:text-[#aeb8b5]">
            只回答 6 个问题，用这篇文章的分层模型估算：有多少人认得你、会复访你、会在关键时刻为你行动。
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ['6', '个问题'],
              ['10 秒', '单次 PV 口径'],
              ['A0-A3', '流量等级'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-white/70 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="font-mono text-lg font-semibold text-[#244c55] dark:text-[#acd4d8]">{value}</div>
                <div className="mt-1 text-xs text-[#65706b] dark:text-[#9aa7a4]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-[#68736e] dark:text-[#9aa7a4]">进度 {answeredCount}/{questions.length}</div>
              <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-[#dfe3d9] dark:bg-[#26303a]">
                <div className="h-full rounded-full bg-[#2f7782] transition-all dark:bg-[#9fc5ad]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#cdd4c9] bg-white px-3 text-sm text-[#48524c] transition hover:border-[#8ea39b] hover:text-[#18211d] dark:border-[#34404b] dark:bg-[#121b24] dark:text-[#c2cbc8] dark:hover:border-[#6b7d89]"
            >
              <IconRefresh size={15} stroke={1.8} />
              重测
            </button>
          </div>

          {result ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#234b55] px-3 py-1 text-sm font-medium text-white dark:bg-[#bed6ca] dark:text-[#111820]">
                    <IconChartBar size={16} stroke={1.8} />
                    {result.level.code} · {result.level.name}
                  </div>
                  <div className="mt-3 text-5xl font-semibold leading-none text-[#20231f] dark:text-white">{result.score}</div>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#5f6862] dark:text-[#aeb8b5]">{result.level.text}</p>
                </div>
                <div className="rounded-md border border-[#d7ddd1] bg-white/65 p-3 text-right dark:border-[#303b46] dark:bg-white/[0.04]">
                  <div className="text-xs text-[#66716b] dark:text-[#9aa7a4]">人生有效 PV 估算</div>
                  <div className="mt-1 font-mono text-xl font-semibold text-[#8a5b20] dark:text-[#f2ca7e]">
                    {formatRange(result.lowPv, result.highPv)}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['识别 UV', formatNumber(result.recognitionUv), '认得你或知道你是谁的人'],
                  ['活跃 UV', formatNumber(result.activeUv), '过去一年仍有真实互动的人'],
                  ['关注 UV', formatNumber(result.attentionUv), '会认真复访和关心近况的人'],
                  ['行动 UV', formatNumber(result.actionUv), '可能付出行动成本的人'],
                  ['高价值 UV', formatNumber(result.highValueUv), '带来机会、信息或转介绍的人'],
                  ['停留时长', formatRange(result.stayLow, result.stayHigh, ' 小时'), '别人把注意力放在你身上的总时长'],
                ].map(([label, value, desc]) => (
                  <div key={label} className="rounded-md border border-[#d9ded5] bg-white/70 p-4 dark:border-[#303b46] dark:bg-white/[0.04]">
                    <div className="text-xs text-[#67716b] dark:text-[#9aa7a4]">{label}</div>
                    <div className="mt-1 font-mono text-2xl font-semibold text-[#23343a] dark:text-[#dce9e6]">{value}</div>
                    <div className="mt-1 text-xs leading-5 text-[#737b76] dark:text-[#96a29f]">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#234b55] text-white dark:bg-[#bed6ca] dark:text-[#111820]">
                  <IconUsers size={18} stroke={1.9} />
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#67807a] dark:text-[#98b9b0]">
                    {currentQuestion.label}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold leading-snug text-[#20231f] dark:text-white">{currentQuestion.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#66716b] dark:text-[#9aa7a4]">{currentQuestion.hint}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {currentQuestion.options.map((option) => {
                  const active = answers[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => choose(currentQuestion.id, option.value)}
                      className={[
                        'group flex min-h-14 items-center justify-between rounded-md border px-4 py-3 text-left transition',
                        active
                          ? 'border-[#2f7782] bg-[#e4f0ed] text-[#173b40] dark:border-[#9fc5ad] dark:bg-[#1d2c29] dark:text-[#dff0eb]'
                          : 'border-[#d7ddd1] bg-white/65 text-[#344039] hover:border-[#8ea39b] hover:bg-white dark:border-[#303b46] dark:bg-white/[0.04] dark:text-[#d5ddda] dark:hover:border-[#6b7d89]',
                      ].join(' ')}
                    >
                      <span className="font-mono text-lg font-semibold">{option.label}</span>
                      <IconArrowRight size={17} stroke={1.8} className="opacity-55 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrent((index) => Math.max(0, index - 1))}
                  disabled={current === 0}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#cdd4c9] bg-white px-3 text-sm text-[#48524c] transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#34404b] dark:bg-[#121b24] dark:text-[#c2cbc8]"
                >
                  <IconChevronLeft size={15} stroke={1.8} />
                  上一题
                </button>
                <div className="text-xs text-[#737d77] dark:text-[#98a4a1]">按最接近的区间选，不需要精确。</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
