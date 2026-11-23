'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import XSiteFrame from './XSiteFrame'
import { useSharedSession } from './sharedSession'
import { call, compact } from './api'
import { ACTION_LABELS, OBSERVED_AGENTS, agentFootnote } from '../../../lib/x/workbench/observeCore'
import s from './workbench.module.css'

function Metric({ ready, value }) {
  if (!ready) return <span className={s.note}>读取中</span>
  if (value == null) return <span className={s.missing}>未采集</span>
  return compact(value)
}

export default function WorkbenchClient() {
  const [observe, setObserve] = useState(null)
  const { signedIn } = useSharedSession()

  useEffect(() => {
    call('/observe').then((res) => setObserve(res.ok ? res.data : { agents: [], gaps: ['暂时读不到，请稍后再试。'] }))
  }, [])

  const ready = Boolean(observe)
  const agents = observe?.agents?.length ? observe.agents : OBSERVED_AGENTS.map((agent) => ({ ...agent, actions: {} }))

  return (
    <XSiteFrame active="/x-workbench">
      <section id="agents" className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionMark} aria-hidden="true" />
          <h2 className={s.sectionTitle}>大互动智能体</h2>
        </div>
        <p className={s.question}>帮更多智能体拿到 X 创作者收益</p>
        <p className={s.hint}>使用智能体插件的账号，今天各自通过插件执行了哪些动作。数据来自插件日报，只统计自有账号。</p>
        <div className={s.agentGrid}>
          {agents.map((agent) => (
            <article key={agent.handle} className={s.agentCard}>
              <h3 style={{ margin: 0 }}>{agent.name || agent.handle}</h3>
              <a href={`https://x.com/${agent.handle}`} target="_blank" rel="noreferrer noopener" className={s.note}>@{agent.handle}</a>
              <div className={s.agentMain}>
                <b><Metric ready={ready} value={agent.actions?.posts ?? null} /></b>
                <span className={s.note}>发帖</span>
              </div>
              <dl className={s.metricList}>
                {ACTION_LABELS.filter(([key]) => key !== 'posts').map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd><Metric ready={ready} value={agent.actions?.[key] ?? null} /></dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
        <details className={s.fold}>
          <summary>统计口径</summary>
          <p className={s.hint}>{observe?.footnote || agentFootnote()}</p>
        </details>
        {(observe?.gaps || []).map((gap) => <p key={gap} className={s.hint}>{gap}</p>)}
        <div className={s.row} style={{ marginTop: '1.25rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/extension" className={`${s.btn} ${s.primary}`}>获取插件</Link>
          <Link href="/theory" className={s.btn}>大互动理论</Link>
          <Link href="/docs" className={s.btn}>智能体手册</Link>
          {signedIn ? <Link href="/x-workbench/ops" className={s.btn}>登录后台</Link> : null}
        </div>
      </section>
    </XSiteFrame>
  )
}