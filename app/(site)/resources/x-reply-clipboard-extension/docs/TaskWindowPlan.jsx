'use client'

import Image from 'next/image'
import { useState } from 'react'

const SHOTS = [
  {
    id: 'schedule-desk',
    step: '01',
    label: '排班台',
    src: '/images/x-reply-clipboard-extension/panel-v4-schedule-desk.webp',
    width: 659,
    height: 1024,
    title: '单页签排班台',
    caption: '今日统计与排班台卡片（上一 / 当前 / 下一）；本机记录在排班设置。运行绿边、等待黄边、停止红边。',
  },
  {
    id: 'task-rounds',
    step: '02',
    label: '任务评次',
    src: '/images/x-reply-clipboard-extension/panel-v4-task-rounds.webp',
    width: 668,
    height: 948,
    title: '任务子页',
    caption: '点进单项后看第几次、第几轮、本轮目标和频率挡位；「← 返回排班台」返回，不改队列。',
  },
  {
    id: 'panel-overview',
    step: '03',
    label: '面板全貌',
    src: '/images/x-reply-clipboard-extension/panel-v4-panel-overview.webp',
    width: 501,
    height: 1024,
    title: '顶栏与轮班记录',
    caption: '账号、版本和今日合计在顶栏；下方是本机轮班历史，记录每轮为何让出页签。',
  },
]

function PhoneFrame({ shot, active }) {
  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-[28px] border bg-[color-mix(in_srgb,var(--site-panel)_92%,#0f172a)] p-2 shadow-[0_22px_60px_color-mix(in_srgb,var(--site-shadow)_18%,transparent)] transition ${
        active
          ? 'border-[color-mix(in_srgb,var(--site-green)_55%,var(--site-line))] ring-2 ring-[color-mix(in_srgb,var(--site-green)_28%,transparent)]'
          : 'border-[var(--site-line)]'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3" aria-hidden="true">
        <span className="h-1.5 w-16 rounded-full bg-black/35" />
      </div>
      <div className="overflow-hidden rounded-[22px] bg-[var(--site-panel)]">
        <Image
          src={shot.src}
          alt={`${shot.title}：${shot.caption}`}
          width={shot.width}
          height={shot.height}
          sizes="(max-width: 768px) 78vw, 240px"
          className="block h-auto w-full"
          unoptimized
        />
      </div>
    </div>
  )
}

export default function TaskWindowPlan() {
  const [selected, setSelected] = useState(0)

  return (
    <figure
      className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_srgb,var(--site-green)_10%,transparent),transparent_55%),color-mix(in_srgb,var(--site-panel-strong)_90%,transparent)]"
      aria-labelledby="task-window-plan-title"
    >
      <div className="border-b border-[var(--site-line)] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] px-2 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">
            真实面板 · v4
          </span>
          <span className="text-[11px] text-[var(--site-faint)]">一账号一页签 · 串行轮班</span>
        </div>
        <h4 id="task-window-plan-title" className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">
          面板长什么样
        </h4>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[var(--site-muted)]">
          下面三张是本地面板实拍。大屏并排看全貌；小屏点选切换。截图会随版本微调，规则以本页文字为准。
        </p>
      </div>

      <div className="space-y-5 p-3.5 md:p-5">
        <div className="flex flex-wrap gap-1.5 lg:hidden" role="tablist" aria-label="面板截图">
          {SHOTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected === index}
              onClick={() => setSelected(index)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                selected === index
                  ? 'border-[var(--site-green)] bg-[var(--site-green)] text-white'
                  : 'border-[var(--site-line)] bg-[var(--site-panel)] text-[var(--site-muted)]'
              }`}
            >
              {item.step} · {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-[320px] lg:hidden" aria-live="polite">
          <PhoneFrame shot={SHOTS[selected]} active />
          <div className="mt-3 px-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--site-faint)]">{SHOTS[selected].step}</span>
              <strong className="text-[13px] text-[var(--site-ink)]">{SHOTS[selected].title}</strong>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">{SHOTS[selected].caption}</p>
          </div>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-3">
          {SHOTS.map((shot) => (
            <div key={shot.id}>
              <PhoneFrame shot={shot} active={false} />
              <div className="mt-3 px-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--site-faint)]">{shot.step}</span>
                  <strong className="text-[13px] text-[var(--site-ink)]">{shot.title}</strong>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">{shot.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <figcaption className="border-t border-[var(--site-line)] px-4 py-3 text-[11px] leading-5 text-[var(--site-faint)] md:px-5">
        若本地面板与截图不一致，以你当前加载的扩展版本为准；文档中心会随发版替换实拍。
      </figcaption>
    </figure>
  )
}
