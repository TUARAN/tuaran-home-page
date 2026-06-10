'use client'

import { useMemo, useState } from 'react'

const MOMENTS = [
  {
    id: 'moment-agent-loop',
    mood: '👨‍💻',
    moodLabel: '正在 Coding',
    relativeTime: '2 小时前',
    text:
      '正在建设“数字员工”。核心思路参考 OpenCode 模式，致力于打造“本地私有业务 + 通用大模型”的应用闭环，探索 AI Agent 的工程化落地。',
  },
  {
    id: 'moment-snippet',
    mood: '☕',
    moodLabel: '摸鱼思考中',
    relativeTime: '昨天',
    text:
      '深度认知 B/C 端差异：toB 锚定组织规律，toC 侧重个体情绪。不看好零散卖课，认可规模化产出。',
    emphasis: '落地重心：toB 做博主联盟，toC 做前端周看。',
  },
]

function MomentBody({ text }) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = text.length > 140
  const displayText = shouldCollapse && !expanded ? `${text.slice(0, 140)}...` : text

  return (
    <div className="space-y-2">
      <p className="mb-0 text-[13px] leading-[1.8] text-[#52534d] dark:text-gray-300">
        {displayText}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#747767] transition-colors hover:text-[#4a4b3f] dark:text-[#93a0b3] dark:hover:text-white"
        >
          {expanded ? '收起' : '展开'}
        </button>
      ) : null}
    </div>
  )
}

export default function LatestMoments() {
  const items = useMemo(() => MOMENTS.slice(0, 2), [])

  return (
    <>
      <section className="mb-5 border-b border-[#dee0db] pb-5 dark:border-gray-800">
        <div className="mb-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#808372] dark:text-[#8e9ab0]">
            Moments
          </p>
          <h3 className="mb-0 font-serif text-[18px] font-semibold tracking-[0.03em] text-[#1d1d1a] dark:text-gray-100">
            最新动态
          </h3>
        </div>

        <div className="relative pl-5">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-[8px] top-1 w-px bg-[linear-gradient(180deg,rgba(203,192,170,0.95),rgba(203,192,170,0.15))] dark:bg-[linear-gradient(180deg,rgba(78,89,105,0.95),rgba(78,89,105,0.18))]"
          />

          <div className="space-y-4">
            {items.map((moment) => (
              <article
                key={moment.id}
                className="relative rounded-[20px] border border-[#d7d8ce] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(112,96,68,0.05)] dark:border-[#232c36] dark:bg-[#121821]"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-[-17px] top-4 h-3 w-3 rounded-full border border-[#bcbeae] bg-[#f1f2ed] shadow-[0_0_0_4px_rgba(248,245,240,1)] dark:border-[#49566a] dark:bg-[#19212b] dark:shadow-[0_0_0_4px_rgba(16,21,29,1)]"
                />

                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-0 text-[12px] leading-6 text-[#5d5e56] dark:text-gray-300">
                      <span className="mr-1.5 text-[15px]" aria-hidden="true">{moment.mood}</span>
                      <span>{moment.moodLabel}</span>
                    </p>
                    <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#868979] dark:text-[#8793a6]">
                      {moment.relativeTime}
                    </p>
                  </div>
                </div>

                <MomentBody text={moment.text} />
                {moment.emphasis ? (
                  <p className="mb-0 mt-3 rounded-2xl border border-[#dfe0d8] bg-[#f4f5f1] px-3 py-2 text-[12px] leading-6 text-[#54554d] dark:border-[#2b3440] dark:bg-[#0d1218] dark:text-gray-300">
                    {moment.emphasis}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
