'use client'

import { useEffect, useState } from 'react'

import XPage from './XPage'
import { call, compact } from './api'
import { ACTION_LABELS, OBSERVED_AGENTS, agentFootnote } from '../../../lib/x/workbench/observeCore'
import s from './workbench.module.css'

function Metric({ ready, value }) {
  if (!ready) return <span className={s.skeleton} aria-hidden="true" />
  if (value == null) return <span className={s.missing}>—</span>
  return compact(value)
}

export default function WorkbenchClient() {
  const [observe, setObserve] = useState(null)

  useEffect(() => {
    call('/observe').then((res) => setObserve(res.ok ? res.data : { agents: [], gaps: ['暂时读不到，请稍后再试。'] }))
  }, [])

  const ready = Boolean(observe)
  const agents = observe?.agents?.length ? observe.agents : OBSERVED_AGENTS.map((agent) => ({ ...agent, actions: {} }))

  return (
    <XPage
      active="/x-workbench"
      title="大互动智能体"
      intro="帮更多智能体拿到 X 创作者收益。"
      meta="使用智能体插件的账号今天各自执行了哪些动作，数据来自插件日报，只统计自有账号。"
    >
      <section id="agents" className={s.section}>
        <div className={s.agentGrid}>
          {agents.map((agent) => {
            const hasReport = ready && Object.values(agent.actions || {}).some((value) => value != null)
            const avatarText = String(agent.name || agent.handle || '?').slice(-2)
            return (
              <article key={agent.handle} className={s.agentCard}>
                <div className={s.agentCardHead}>
                  <span className={s.agentAvatar} aria-hidden="true">{avatarText}</span>
                  <div className={s.agentIdentity}>
                    <h3 className={s.agentName}>{agent.name || agent.handle}</h3>
                    <a href={`https://x.com/${agent.handle}`} target="_blank" rel="noreferrer noopener" className={s.agentHandle}>@{agent.handle}</a>
                  </div>
                  <span className={`${s.statusChip} ${hasReport ? s.statusOk : ''}`}>
                    {!ready ? '读取中' : hasReport ? '今日已汇总' : '未采集'}
                  </span>
                </div>
                <dl className={s.metricRow}>
                  {ACTION_LABELS.map(([key, label]) => (
                    <div key={key} className={key === 'posts' ? `${s.metricCell} ${s.metricHero}` : s.metricCell}>
                      <dd><Metric ready={ready} value={agent.actions?.[key] ?? null} /></dd>
                      <dt>{label}</dt>
                    </div>
                  ))}
                </dl>
              </article>
            )
          })}
        </div>
        <details className={s.fold}>
          <summary>统计口径</summary>
          <p className={s.hint}>{observe?.footnote || agentFootnote()}</p>
        </details>
        {(observe?.gaps || []).map((gap) => <p key={gap} className={s.hint}>{gap}</p>)}
      </section>
    </XPage>
  )
}
