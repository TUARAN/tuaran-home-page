'use client'

import { useMemo, useState } from 'react'
import {
  IconBrain,
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
  const [selected, setSelected] = useState([])
  const totalWeight = questions.reduce((sum, question) => sum + question.weight, 0)
  const rawScore = questions
    .filter((question) => selected.includes(question.id))
    .reduce((sum, question) => sum + question.weight, 0)
  const score = Math.round((rawScore / totalWeight) * 100)
  const level = getLevel(score)
  const topAxes = useMemo(() => getTopAxes(selected), [selected])

  function toggle(id) {
    setSelected((prev) => (
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    ))
  }

  function reset() {
    setSelected([])
  }

  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border border-[#dadfd5] bg-[#f7f8f2] text-[#1f241f] shadow-sm dark:border-[#27313b] dark:bg-[#101820] dark:text-gray-100">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-[#dadfd5] bg-[#e9eee6] p-5 dark:border-[#27313b] dark:bg-[#121f21] lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cdd8cc] bg-white/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#526b62] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#9ac0b3]">
            <IconClipboardCheck size={15} stroke={1.8} />
            Self check
          </div>

          <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-[#1b241e] dark:text-white sm:text-3xl">
            反驳性沟通自测
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5d665e] dark:text-[#aeb8b5]">
            勾选过去 30 天里“经常发生”的项。它不是诊断，只用来判断你的第一反应更像批判性思考，还是反驳优先的防御模式。
          </p>

          <div className="mt-6 rounded-md border border-[#d6ddd0] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-end justify-between gap-3">
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

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dfe5dc] dark:bg-[#28333c]">
              <div
                className="h-full rounded-full bg-[#2f7782] transition-all duration-300 dark:bg-[#9fc5ad]"
                style={{ width: `${score}%` }}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-[#5c665f] dark:text-[#aeb8b5]">{level.summary}</p>
            <div className="mt-4 rounded-md bg-[#fff8e8] p-3 text-sm leading-6 text-[#6d4b16] dark:bg-[#241f13] dark:text-[#f0d49a]">
              {level.action}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['7', '道强特征题'],
              [`${selected.length}`, '已勾选'],
              ['非诊断', '仅供自查'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-white/70 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="font-mono text-lg font-semibold text-[#254f55] dark:text-[#acd4d8]">{value}</div>
                <div className="mt-1 text-xs text-[#68736b] dark:text-[#9aa7a4]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#26342d] dark:text-white">
                <IconTargetArrow size={18} stroke={1.8} />
                勾选符合你的项
              </div>
              <p className="mt-1 text-xs leading-5 text-[#737d77] dark:text-[#98a4a1]">
                只选“经常如此”，偶尔发生不要选。
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

          <div className="mt-5 grid gap-2">
            {questions.map((question) => {
              const checked = selected.includes(question.id)
              return (
                <label
                  key={question.id}
                  className={[
                    'group grid cursor-pointer grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-md border p-3.5 transition',
                    checked
                      ? 'border-[#2f7782] bg-[#e4f0ed] dark:border-[#9fc5ad] dark:bg-[#1d2c29]'
                      : 'border-[#d8ded2] bg-white/65 hover:border-[#8ea39b] hover:bg-white dark:border-[#303b46] dark:bg-white/[0.04] dark:hover:border-[#6b7d89]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border transition',
                      checked
                        ? 'border-[#2f7782] bg-[#2f7782] text-white dark:border-[#9fc5ad] dark:bg-[#9fc5ad] dark:text-[#111820]'
                        : 'border-[#c8d0c5] bg-white text-transparent dark:border-[#44505b] dark:bg-[#111820]',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    <IconCheck size={16} stroke={2.2} />
                  </span>
                  <span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(question.id)}
                      className="sr-only"
                    />
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#edf1e9] px-2 py-0.5 text-[11px] font-semibold text-[#587066] dark:bg-white/[0.06] dark:text-[#a9c6bb]">
                        {question.axis}
                      </span>
                      <span className="font-mono text-[11px] text-[#879084] dark:text-[#83908c]">
                        +{question.weight}
                      </span>
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold leading-6 text-[#202720] dark:text-gray-100">
                      {question.text}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#737d77] dark:text-[#98a4a1]">
                      {question.hint}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="mt-5 grid gap-3 rounded-md border border-[#d8ded2] bg-white/60 p-4 dark:border-[#303b46] dark:bg-white/[0.04] sm:grid-cols-[1fr_1fr]">
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
