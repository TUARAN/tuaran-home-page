'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

/** 真实面板截图按版本归档；数组首项为默认展示的最新版。旧版文件保留，勿覆盖删除。 */
const PANEL_SHOT_VERSIONS = [
  {
    version: '4.15.60',
    label: 'v4.15.60',
    capturedAt: '2026-11-16',
    latest: true,
    shots: [
      {
        id: 'schedule-desk',
        step: '01',
        label: '排班台',
        src: '/images/x-reply-clipboard-extension/panel-v4.15.60-schedule.webp',
        width: 1450,
        height: 1640,
        title: '排班台双栏',
        caption:
          'v4.15.60 · 2026-11-16 实拍。左侧已排班、右侧未排班；勾选或拖拽调整。截图中的冷却原因和勾选是示例账号当时状态。',
      },
      {
        id: 'task-rounds',
        step: '02',
        label: '任务详情',
        src: '/images/x-reply-clipboard-extension/panel-v4.15.60-task.webp',
        width: 798,
        height: 888,
        title: '评论大V 任务详情',
        caption:
          'v4.15.60 · 2026-11-16 实拍。返回首页、速度表、@Grok 与启停。截图所选慢档是默认档；停止中按钮只反映拍摄瞬间。',
      },
    ],
  },
  {
    version: '4.3.24',
    label: 'v4.3.24',
    capturedAt: '2026-11-02',
    latest: false,
    shots: [
      {
        id: 'schedule-desk',
        step: '01',
        label: '排班台',
        src: '/images/x-reply-clipboard-extension/panel-v4.3.24-schedule.webp',
        width: 720,
        height: 1450,
        title: '排班台与等待原因',
        caption:
          'v4.3.24 · 2026-11-02 实拍。顶部分类统计、任务明细、当前与候选任务；冷却原因和排班状态分开显示。截图中的勾选和速度是示例账号设置。',
      },
      {
        id: 'task-rounds',
        step: '02',
        label: '任务详情',
        src: '/images/x-reply-clipboard-extension/panel-v4.3.24-task.webp',
        width: 720,
        height: 1520,
        title: '评论首页任务详情',
        caption:
          'v4.3.24 · 2026-11-02 实拍。返回排班台、暂停当前任务、速度表、边界测试与不限速选项。截图底部的优先级和时段已经从当前任务页去掉。截图所选超快档不代表默认档。',
      },
    ],
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
  const [versionId, setVersionId] = useState(PANEL_SHOT_VERSIONS[0].version)
  const [selected, setSelected] = useState(0)

  const version = useMemo(
    () => PANEL_SHOT_VERSIONS.find((item) => item.version === versionId) || PANEL_SHOT_VERSIONS[0],
    [versionId],
  )
  const shots = version.shots
  const activeShot = shots[Math.min(selected, shots.length - 1)] || shots[0]

  function onVersionChange(nextVersion) {
    setVersionId(nextVersion)
    setSelected(0)
  }

  return (
    <figure
      className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_srgb,var(--site-green)_10%,transparent),transparent_55%),color-mix(in_srgb,var(--site-panel-strong)_90%,transparent)]"
      aria-labelledby="task-window-plan-title"
    >
      <div className="border-b border-[var(--site-line)] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] py-0.5 pl-2 pr-1.5 text-[10px] font-semibold text-[var(--site-green)]">
            <span className="whitespace-nowrap">真实面板</span>
            <select
              aria-label="面板截图版本"
              value={version.version}
              onChange={(event) => onVersionChange(event.target.value)}
              className="max-w-[9.5rem] cursor-pointer appearance-none rounded-full border-0 bg-transparent py-0.5 pl-1 pr-5 text-[10px] font-semibold text-[var(--site-green)] outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%232f6b4f' d='M1 1l4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 4px center',
              }}
            >
              {PANEL_SHOT_VERSIONS.map((item) => (
                <option key={item.version} value={item.version}>
                  {item.label}
                  {item.latest ? ' · 最新' : ''}
                </option>
              ))}
            </select>
          </label>
          <span className="text-[11px] text-[var(--site-faint)]">一账号一页签 · 串行轮班</span>
        </div>
        <h4 id="task-window-plan-title" className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">
          面板长什么样
        </h4>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[var(--site-muted)]">
          下面是本地面板实拍，按版本归档。大屏并排看全貌；小屏点选切换。默认看最新版，也可下拉对照旧版。规则以本页文字为准。
        </p>
      </div>

      <div className="space-y-5 p-3.5 md:p-5">
        <div className="flex flex-wrap gap-1.5 lg:hidden" role="tablist" aria-label="面板截图">
          {shots.map((item, index) => (
            <button
              key={`${version.version}-${item.id}`}
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
          <PhoneFrame shot={activeShot} active />
          <div className="mt-3 px-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--site-faint)]">{activeShot.step}</span>
              <strong className="text-[13px] text-[var(--site-ink)]">{activeShot.title}</strong>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-[var(--site-muted)]">{activeShot.caption}</p>
          </div>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-2">
          {shots.map((shot) => (
            <div key={`${version.version}-${shot.id}`}>
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
        若本地面板与截图不一致，以你当前加载的扩展版本为准。实拍按版本号归档，旧图保留，可用上方下拉对照。
      </figcaption>
    </figure>
  )
}
