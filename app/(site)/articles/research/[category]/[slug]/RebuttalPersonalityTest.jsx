'use client'

import { useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconBrain,
  IconChevronLeft,
  IconCheck,
  IconClipboardCheck,
  IconRefresh,
  IconShieldHalf,
  IconTargetArrow,
} from '@tabler/icons-react'

const questions = [
  {
    id: 'interrupt',
    weight: 14,
    axis: '低延迟反驳',
    text: '别人话还没说完，我脑子里已经在组织反驳。',
    hint: '重点不是不同意，而是反应速度快到理解还没完成。',
  },
  {
    id: 'control',
    weight: 13,
    axis: '自主威胁',
    text: '别人只是给建议，我会本能地听成“你在要求我”。',
    hint: '建议、提醒、关心都容易被听成控制。',
  },
  {
    id: 'identity',
    weight: 14,
    axis: '自我绑定',
    text: '别人质疑我的观点时，我会感觉像是在否定我这个人。',
    hint: '观点和自尊绑得越紧，反驳越容易自动启动。',
  },
  {
    id: 'partial',
    weight: 12,
    axis: '承认困难',
    text: '我很难先说“你有一部分是对的”，哪怕对方确实说中了。',
    hint: '承认局部正确，会被身体误判成让步或认输。',
  },
  {
    id: 'repair',
    weight: 15,
    axis: '关系代价',
    text: '亲近的人或同事说过我“总要杠一下”“什么都要赢”。',
    hint: '外部反馈比自我评价更能反映关系成本。',
  },
  {
    id: 'solution',
    weight: 12,
    axis: '只拆不建',
    text: '我能很快指出问题，但不常给出可执行替代方案。',
    hint: '只输出否定，会让反驳从贡献变成噪音。',
  },
  {
    id: 'silence',
    weight: 20,
    axis: '沟通后果',
    text: '讨论结束后，对方会变沉默、敷衍，或下次干脆不找我商量。',
    hint: '这是最重要的信号：反驳已经改变了别人靠近你的意愿。',
  },
]

const levels = [
  {
    min: 0,
    max: 24,
    name: '低倾向',
    tone: '正常反对',
    summary: '你可能会反对，但通常还能听完、复述和更新观点。反驳更多是思考工具，不太像默认防御。',
    action: '保留批判性，继续练习“先确认对方意思，再说风险”。',
  },
  {
    min: 25,
    max: 49,
    name: '情境触发型',
    tone: '压力下会先防御',
    summary: '你不是一直反驳，但在被建议、被评价或疲惫时，容易把对话听成控制或否定。',
    action: '遇到触发点时先停三秒，用“我理解你是说……”延迟第一反应。',
  },
  {
    min: 50,
    max: 74,
    name: '明显反驳优先',
    tone: '关系已开始付成本',
    summary: '反驳可能已经成为你的默认姿态。别人未必觉得你没道理，但可能觉得和你说话很累。',
    action: '给自己设硬规则：每次反对前必须先复述、承认一处合理点，再给替代方案。',
  },
  {
    min: 75,
    max: 100,
    name: '高反驳消耗型',
    tone: '需要系统调整',
    summary: '你的反驳很可能已经影响亲密关系或协作关系。重点不是再证明自己有逻辑，而是降低沟通损耗。',
    action: '建议把“红队能力”放进固定场景：评审、写作、风险清单；在关系对话里先练暂停和修复。',
  },
]

function getLevel(score) {
  return levels.find((level) => score >= level.min && score <= level.max) || levels[0]
}

function getTopAxes(selected) {
  return questions
    .filter((question) => selected.includes(question.id))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
}

export default function RebuttalPersonalityTest() {
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const selected = questions.filter((question) => answers[question.id] === true).map((question) => question.id)
  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[current]
  const totalWeight = questions.reduce((sum, question) => sum + question.weight, 0)
  const rawScore = questions
    .filter((question) => selected.includes(question.id))
    .reduce((sum, question) => sum + question.weight, 0)
  const score = Math.round((rawScore / totalWeight) * 100)
  const level = getLevel(score)
  const topAxes = useMemo(() => getTopAxes(selected), [selected])
  const progress = Math.round((answeredCount / questions.length) * 100)
  const isComplete = answeredCount === questions.length

  function answer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    if (current < questions.length - 1) {
      window.setTimeout(() => setCurrent((index) => Math.min(index + 1, questions.length - 1)), 120)
    }
  }

  function reset() {
    setAnswers({})
    setCurrent(0)
  }

  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border border-[#dadfd5] bg-[#f7f8f2] text-[#1f241f] shadow-sm dark:border-[#27313b] dark:bg-[#101820] dark:text-gray-100">
      <div className="border-b border-[#dadfd5] bg-[#e9eee6] p-4 dark:border-[#27313b] dark:bg-[#121f21]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cdd8cc] bg-white/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#526b62] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#9ac0b3]">
              <IconClipboardCheck size={15} stroke={1.8} />
              Self check
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[#1b241e] dark:text-white sm:text-2xl">
              反驳性沟通自测
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#5d665e] dark:text-[#aeb8b5]">
            每次只答 1 题。按过去 30 天“经常如此”来选，不是诊断，只做自查。
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-[#dadfd5] p-4 dark:border-[#27313b] lg:border-b-0 lg:border-r">
          <div className="rounded-md border border-[#d6ddd0] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6d776e] dark:text-[#99a6a1]">
                  Score
                </div>
                <div className="mt-1 text-5xl font-semibold leading-none text-[#214b54] dark:text-[#c5ded4]">
                  {score}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[#1f241f] dark:text-white">{level.name}</div>
                <div className="mt-1 text-xs text-[#68726a] dark:text-[#9ca8a4]">{level.tone}</div>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe5dc] dark:bg-[#28333c]">
              <div
                className="h-full rounded-full bg-[#2f7782] transition-all duration-300 dark:bg-[#9fc5ad]"
                style={{ width: `${score}%` }}
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-[#5c665f] dark:text-[#aeb8b5]">{level.summary}</p>
            <div className="mt-3 rounded-md bg-[#fff8e8] p-3 text-sm leading-6 text-[#6d4b16] dark:bg-[#241f13] dark:text-[#f0d49a]">
              {level.action}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              [`${answeredCount}/7`, '已回答'],
              [`${selected.length}`, '符合项'],
              ['非诊断', '仅供自查'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-[#dbe1d7] bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="font-mono text-lg font-semibold text-[#254f55] dark:text-[#acd4d8]">{value}</div>
                <div className="mt-1 text-xs text-[#68736b] dark:text-[#9aa7a4]">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe5dc] dark:bg-[#28333c]">
            <div className="h-full rounded-full bg-[#b7791f] transition-all duration-300 dark:bg-[#f0ca7a]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#26342d] dark:text-white">
                <IconTargetArrow size={18} stroke={1.8} />
                {isComplete ? '结果摘要' : `第 ${current + 1} 题 / ${questions.length}`}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#737d77] dark:text-[#98a4a1]">
                {isComplete ? '可以返回修改任意题，也可以清空重测。' : '选“符合”会计入分数；选“不符合”不会计分。'}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#cdd4c9] bg-white px-3 text-sm text-[#48524c] transition hover:border-[#8ea39b] hover:text-[#18211d] dark:border-[#34404b] dark:bg-[#121b24] dark:text-[#c2cbc8] dark:hover:border-[#6b7d89]"
            >
              <IconRefresh size={15} stroke={1.8} />
              清空
            </button>
          </div>

          {isComplete ? (
            <div className="mt-5 rounded-md border border-[#d8ded2] bg-white/65 p-4 dark:border-[#303b46] dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#68736e] dark:text-[#9aa7a4]">你的结果</div>
                  <div className="mt-1 text-2xl font-semibold text-[#1f241f] dark:text-white">{level.name}</div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6962] dark:text-[#aeb8b5]">{level.summary}</p>
                </div>
                <div className="rounded-md bg-[#e9efe7] px-4 py-3 text-right dark:bg-[#1d2a28]">
                  <div className="font-mono text-3xl font-semibold text-[#254f55] dark:text-[#acd4d8]">{score}</div>
                  <div className="text-xs text-[#68736b] dark:text-[#9aa7a4]">总分</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-[#d8ded2] bg-white/65 p-5 dark:border-[#303b46] dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#edf1e9] px-2.5 py-1 text-xs font-semibold text-[#587066] dark:bg-white/[0.06] dark:text-[#a9c6bb]">
                  {currentQuestion.axis}
                </span>
                <span className="font-mono text-xs text-[#879084] dark:text-[#83908c]">
                  +{currentQuestion.weight}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold leading-snug text-[#202720] dark:text-gray-100">
                {currentQuestion.text}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#68736e] dark:text-[#9aa7a4]">
                {currentQuestion.hint}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => answer(currentQuestion.id, true)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#2f7782] bg-[#2f7782] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#25646d] dark:border-[#9fc5ad] dark:bg-[#9fc5ad] dark:text-[#111820] dark:hover:bg-[#b8d7ca]"
                >
                  <IconCheck size={17} stroke={2} />
                  符合，经常这样
                </button>
                <button
                  type="button"
                  onClick={() => answer(currentQuestion.id, false)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#cfd8cc] bg-white px-4 py-3 text-sm font-semibold text-[#425048] transition hover:border-[#8ea39b] hover:text-[#17211d] dark:border-[#34404b] dark:bg-[#121b24] dark:text-[#c2cbc8] dark:hover:border-[#6b7d89]"
                >
                  不符合 / 偶尔才会
                  <IconArrowRight size={16} stroke={1.8} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrent((index) => Math.max(0, index - 1))}
              disabled={current === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#cdd4c9] bg-white px-3 text-sm text-[#48524c] transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#34404b] dark:bg-[#121b24] dark:text-[#c2cbc8]"
            >
              <IconChevronLeft size={15} stroke={1.8} />
              上一题
            </button>
            <div className="flex gap-1.5">
              {questions.map((question, index) => {
                const answered = answers[question.id] !== undefined
                const active = index === current
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    className={[
                      'h-2.5 w-2.5 rounded-full transition',
                      active
                        ? 'bg-[#2f7782] dark:bg-[#9fc5ad]'
                        : answered
                          ? 'bg-[#b7791f] dark:bg-[#f0ca7a]'
                          : 'bg-[#d8ded2] dark:bg-[#3a4650]',
                    ].join(' ')}
                    aria-label={`跳到第 ${index + 1} 题`}
                  />
                )
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-md border border-[#d8ded2] bg-white/50 p-4 dark:border-[#303b46] dark:bg-white/[0.04] sm:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#26342d] dark:text-white">
                <IconShieldHalf size={17} stroke={1.8} />
                主要触发点
              </div>
              {topAxes.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topAxes.map((question) => (
                    <span key={question.id} className="rounded-full bg-[#e9efe7] px-2.5 py-1 text-xs text-[#365b52] dark:bg-[#1d2a28] dark:text-[#b7d1c7]">
                      {question.axis}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-[#737d77] dark:text-[#98a4a1]">
                  勾选后会显示最值得处理的前三个触发点。
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#26342d] dark:text-white">
                <IconBrain size={17} stroke={1.8} />
                一句训练公式
              </div>
              <p className="mt-2 text-xs leading-5 text-[#5f6962] dark:text-[#aeb8b5]">
                我理解你是说 A；我同意其中 B；我担心 C；我建议用 D 验证。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
