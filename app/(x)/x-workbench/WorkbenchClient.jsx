'use client'

import { useEffect, useState } from 'react'

import XPage from './XPage'
import MonitorSection from './MonitorSection'
import AgentRobotAvatar from './AgentRobotAvatar'
import { call, compact } from './api'
import { ACTION_LABELS, OBSERVED_AGENTS, actionCount, agentFootnote } from '../../../lib/x/workbench/observeCore'
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
      intro="插件形态本地运行，本站实时汇总状态与日报，手机或外网打开即可监看。"
      meta="使用智能体插件的账号今天各自执行了哪些动作，数据来自插件日报，只统计自有账号。"
    >
      <section id="agents" className={s.section}>
        <div className={s.agentGrid}>
          {agents.map((agent) => {
            const hasReport = ready && Object.values(agent.actions || {}).some((value) => value != null)
            return (
              <article key={agent.handle} className={s.agentCard}>
                <div className={s.agentCardHead}>
                  <AgentRobotAvatar handle={agent.handle} className={s.agentRobot} />
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
                    <div key={key} className={s.metricCell}>
                      <dd><Metric ready={ready} value={actionCount(agent.actions, key)} /></dd>
                      <dt>{label}</dt>
                    </div>
                  ))}
                </dl>
              </article>
            )
          })}
        </div>
        <div className={s.scopeNote}>
          <h3 className={s.subHead}>统计口径</h3>
          <p className={s.hint}>
            {observe?.footnote || agentFootnote({ reportDate: observe?.reportDate, pendingUpdate: observe === null })}
          </p>
        </div>
        {(observe?.gaps || []).map((gap) => <p key={gap} className={s.hint}>{gap}</p>)}
      </section>
      <MonitorSection />
    </XPage>
  )
}
