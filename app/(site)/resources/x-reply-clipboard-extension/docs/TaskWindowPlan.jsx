'use client'

import Image from 'next/image'
import { useState } from 'react'

const SHOTS = [
  {
    id: 'schedule-desk',
    label: '排班台',
    src: '/images/x-reply-clipboard-extension/panel-v4-schedule-desk.webp',
    width: 541,
    height: 1024,
    title: '单页签排班台',
    caption: '主按钮、上一 / 当前 / 下一任务，以及轮班队列。运行中绿边绕圈，等待中黄边，已停止红边。',
  },
  {
    id: 'task-rounds',
    label: '任务评次',
    src: '/images/x-reply-clipboard-extension/panel-v4-task-rounds.webp',
    width: 660,
    height: 970,
    title: '任务子页 · 轮次进度',
    caption: '从排班台点进单项后，显示第几次执行、第几轮、本轮目标与频率挡位；「← 排班台」返回，不改变队列。',
  },
  {
    id: 'premium-detail',
    label: '精品发帖',
    src: '/images/x-reply-clipboard-extension/panel-v4-premium-detail.webp',
    width: 614,
    height: 1024,
    title: '固定档位任务',
    caption: '精品发帖按北京时间档位进入队列；子页显示今日档位与本次运行，未到点或其他任务运行时显示等待。',
  },
]

export default function TaskWindowPlan() {
  const [selected, setSelected] = useState(0)
  const shot = SHOTS[selected]

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_88%,transparent)]" aria-labelledby="task-window-plan-title">
      <div className="border-b border-[var(--site-line)] px-4 py-4 md:px-5">
        <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] px-2 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">真实面板截图 · v4</span>
        <h4 id="task-window-plan-title" className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">一个账号一个执行页签 · 八项任务串行轮班</h4>
        <p className="mt-1 text-[12px] leading-5 text-[var(--site-muted)]">下面是本地面板实拍，不是示意图。冷却或档期只卡住当前项，其他到期任务接手。</p>
      </div>

      <div className="space-y-4 p-3.5 md:p-5">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="面板截图">
          {SHOTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected === index}
              onClick={() => setSelected(index)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${selected === index ? 'border-[var(--site-green)] bg-[var(--site-green)] text-white' : 'border-[var(--site-line)] bg-[var(--site-panel)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto w-full max-w-[360px]" aria-live="polite">
          <div className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] shadow-[0_18px_50px_color-mix(in_srgb,var(--site-shadow)_14%,transparent)]">
            <Image
              key={shot.src}
              src={shot.src}
              alt={`${shot.title}：${shot.caption}`}
              width={shot.width}
              height={shot.height}
              sizes="(max-width: 640px) calc(100vw - 48px), 360px"
              className="block h-auto w-full"
              unoptimized
            />
          </div>
          <p className="mt-3 text-[12px] font-semibold text-[var(--site-ink)]">{shot.title}</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">{shot.caption}</p>
        </div>
      </div>

      <figcaption className="border-t border-[var(--site-line)] px-4 py-3 text-[11px] leading-5 text-[var(--site-faint)] md:px-5">
        截取自本地 v4 面板。界面文案会随版本微调；规则以本页文字说明为准。
      </figcaption>
    </figure>
  )
}
