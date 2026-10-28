'use client'

import { useState } from 'react'

const ACCOUNTS = [
  { label: '账号 A', color: 'var(--site-green)' },
  { label: '账号 B', color: 'var(--site-accent, var(--site-green))' },
]

const TASKS = [
  { name: '评论帖子', group: '评论' },
  { name: '评论通知', group: '评论' },
  { name: '点赞帖子', group: '点赞' },
  { name: '点赞评论', group: '点赞' },
  { name: '清理未回关', group: '关注' },
  { name: '回关粉丝', group: '关注' },
  { name: '普通发帖', group: '发帖' },
  { name: '精品发帖', group: '发帖' },
]

const SCENARIOS = [
  {
    label: '日常轮转',
    accounts: [
      { active: '评论帖子', page: 'X 首页', next: '评论通知到期后扫描', waiting: '其余任务等待各自排程' },
      { active: '点赞帖子', page: 'X 首页', next: '轮到回关粉丝', waiting: '两项评论保留进度，稍后继续' },
    ],
    note: '评论、点赞、关注、发帖都在同一个队列里轮到；每项按自己的截止时间唤醒，不靠打开更多页签维持运行。',
  },
  {
    label: '发帖档期',
    accounts: [
      { active: '精品发帖', page: 'X 首页', next: '完成后恢复评论通知', waiting: '其他到期任务排队，不补发错过的档位' },
      { active: '评论通知', page: 'X 通知', next: '普通发帖到期后切换', waiting: '账号 A 的发帖不占用账号 B' },
    ],
    note: '精品发帖按北京时间档期获得执行机会；切换前先结束并确认当前动作，未轮到的评论随后继续。',
  },
  {
    label: '单项冷却',
    accounts: [
      { active: '评论通知', page: 'X 通知', next: '继续轮转正常任务', waiting: '点赞帖子已保存冷却截止时间' },
      { active: '清理未回关', page: 'Following', next: '到安全节点后轮换', waiting: '其他任务保持自己的排程' },
    ],
    note: '某项任务受限时，只让该项等待；若 X 明确限制整个账号的操作，再给该账号统一冷却，不影响另一个账号。',
  },
]

function AccountCard({ account, plan }) {
  return (
    <div className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-3.5 md:p-4">
      <div className="flex items-start gap-2.5 border-b border-[var(--site-line)] pb-3">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: account.color }} aria-hidden="true" />
        <div>
          <h5 className="text-[13px] font-semibold text-[var(--site-ink)]">{account.label}</h5>
          <p className="text-[11px] leading-4 text-[var(--site-faint)]">独立 Chrome 配置文件 · 一个 X 执行页签</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--site-green)_40%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-[13px] text-[var(--site-ink)]">当前：{plan.active}</strong>
          <span className="rounded-full bg-[var(--site-panel)] px-2 py-0.5 text-[10px] font-medium text-[var(--site-green)]">{plan.page}</span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[var(--site-muted)]">同一页签按需切到当前任务需要的 X 页面</p>
      </div>
      <div className="mt-3 space-y-1 text-[11px] leading-5 text-[var(--site-muted)]">
        <p><span className="font-semibold text-[var(--site-ink)]">下一步：</span>{plan.next}</p>
        <p><span className="font-semibold text-[var(--site-ink)]">其他项：</span>{plan.waiting}</p>
      </div>
    </div>
  )
}

export default function TaskWindowPlan() {
  const [selected, setSelected] = useState(0)
  const scenario = SCENARIOS[selected]

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_88%,transparent)]" aria-labelledby="task-window-plan-title">
      <div className="border-b border-[var(--site-line)] px-4 py-4 md:px-5">
        <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] px-2 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">v4 本地开发 · 场景示意</span>
        <h4 id="task-window-plan-title" className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">一个账号一个执行页签 · 八项任务轮班</h4>
        <p className="mt-1 text-[12px] leading-5 text-[var(--site-muted)]">两个账号分别调度。页签负责当前动作，扩展后台保管每项任务的进度、等待原因和下次执行时间。</p>
      </div>

      <div className="space-y-4 p-3.5 md:p-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="查看单页签排班场景">
          {SCENARIOS.map((item, index) => (
            <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${selected === index ? 'border-[var(--site-green)] bg-[var(--site-green)] text-white' : 'border-[var(--site-line)] bg-[var(--site-panel)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2" aria-live="polite">
          {ACCOUNTS.map((account, index) => <AccountCard key={account.label} account={account} plan={scenario.accounts[index]} />)}
        </div>

        <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-3.5 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-[12px] text-[var(--site-ink)]">每个账号各有一份后台排班表</strong>
            <span className="text-[11px] text-[var(--site-faint)]">到期 → 安全切换 → 执行 → 保存进度</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="纳入轮班的八项任务">
            {TASKS.map((task) => <span key={task.name} className="rounded-full border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-green)_5%,var(--site-panel))] px-2.5 py-1 text-[10px] font-medium text-[var(--site-muted)]"><span className="text-[var(--site-faint)]">{task.group} · </span>{task.name}</span>)}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[var(--site-muted)]">{scenario.note}</p>
        </div>
      </div>
      <figcaption className="border-t border-[var(--site-line)] px-4 py-3 text-[11px] leading-5 text-[var(--site-faint)] md:px-5">
        这是排班场景示意。切换页面前，扩展会等待当前动作结束并保存草稿、已处理记录和冷却截止时间；排队中的任务显示为等待中。
      </figcaption>
    </figure>
  )
}
