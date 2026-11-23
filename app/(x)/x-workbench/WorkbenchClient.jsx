'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import BoardTab from './BoardTab'
import RadarTab from './RadarTab'
import XSiteFrame from './XSiteFrame'
import { call, compact } from './api'
import {
  ACCOUNT_HOME_NOTE,
  ACTION_LABELS,
  OBSERVED_AGENTS,
  TWEET_BOARD_NOTE,
  agentFootnote,
} from '../../../lib/x/workbench/observeCore'
import s from './workbench.module.css'

function Metric({ ready, value }) {
  if (!ready) return <span className={s.note}>读取中</span>
  if (value == null) return <span className={s.missing}>未采集</span>
  return compact(value)
}

function TweetBoard({ items }) {
  if (!items.length) return null
  return (
    <div className={s.card}>
      {items.map((item, index) => (
        <article key={item.id} className={s.rank}>
          <span className={s.rankNo}>{index + 1}</span>
          <a href={item.url} target="_blank" rel="noreferrer noopener" style={{ flex: 1, color: 'inherit' }}>
            <strong>@{item.handle}</strong>
            <span className={s.note}> {item.topic || '未采集'}</span>
            <div>{item.text || '（无文字）'}</div>
          </a>
          <strong>{compact(item.views)} 曝光</strong>
        </article>
      ))}
    </div>
  )
}

function AccountBoard({ rows }) {
  if (!rows.length) return null
  return (
    <div className={s.card}>
      {rows.map((row, index) => (
        <article key={row.handle} className={s.rank}>
          <span className={s.rankNo}>{index + 1}</span>
          <a href={`https://x.com/${row.handle}`} target="_blank" rel="noreferrer noopener" style={{ flex: 1, color: 'inherit' }}>
            <strong>{row.displayName || `@${row.handle}`}</strong>
            <span className={s.note}> @{row.handle}</span>
          </a>
          <strong>{compact(row.views)} 曝光</strong>
        </article>
      ))}
    </div>
  )
}

export default function WorkbenchClient() {
  const [keyword, setKeyword] = useState('')
  const [observe, setObserve] = useState(null)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || ''
    if (q) setKeyword(q)
    call('/accounts').then((res) => setSignedIn(Boolean(res.ok)))
    call('/observe').then((res) => setObserve(res.ok ? res.data : { unavailable: true, agents: [], tweets: [], accounts: [], gaps: [] }))
  }, [])

  const ready = Boolean(observe)
  const agents = observe?.agents?.length ? observe.agents : OBSERVED_AGENTS
  const tweetConclusion = !observe ? '' : observe.unavailable ? '今日曝光结论暂时读不到。' : observe.tweetConclusion
  const accountConclusion = !observe ? '' : observe.unavailable ? '今日账号榜暂时读不到。' : observe.accountConclusion

  return (
    <XSiteFrame active="/x-workbench">
      <section id="market" className={s.section}>
        <h2 className={s.h2}>流量</h2>
        <p className={s.question}>今天流量去哪了。</p>
        <h3 className={s.h2} style={{ fontSize: 18 }}>推文</h3>
        {tweetConclusion && <p className={s.conclusion}>{tweetConclusion}</p>}
        {observe && !observe.unavailable && <p className={s.hint}>{TWEET_BOARD_NOTE}</p>}
        <TweetBoard items={observe?.tweets || []} />
        <h3 className={s.h2} style={{ fontSize: 18, marginTop: 28 }}>账号</h3>
        {accountConclusion && <p className={s.conclusion}>{accountConclusion}</p>}
        {observe && !observe.unavailable && <p className={s.hint}>{ACCOUNT_HOME_NOTE}</p>}
        <AccountBoard rows={observe?.accounts || []} />
        <p><Link href="/calendar">往日记录</Link></p>
      </section>

      <section id="agents" className={s.section}>
        <h2 className={s.h2}>智能体</h2>
        <p className={s.question}>使用了智能体插件的账号，今天做了什么。</p>
        <p className={s.hint}>目前是矿工阿三、矿长阿富、矿工小十三。</p>
        <div className={s.agentGrid}>
          {agents.map((agent) => (
            <article key={agent.handle} className={s.card}>
              <h3 style={{ margin: '0 0 4px' }}>{agent.name || agent.handle}</h3>
              <a href={`https://x.com/${agent.handle}`} target="_blank" rel="noreferrer noopener">@{agent.handle}</a>
              <dl className={s.metricList}>
                {ACTION_LABELS.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd><Metric ready={ready} value={agent.actions?.[key] ?? null} /></dd>
                  </div>
                ))}
                <div>
                  <dt>推文曝光</dt>
                  <dd><Metric ready={ready} value={agent.views ?? null} /></dd>
                </div>
                <div>
                  <dt>推文互动</dt>
                  <dd><Metric ready={ready} value={agent.interactions ?? null} /></dd>
                </div>
              </dl>
              {ready && agent.tweets != null && <p className={s.note}>已收录推文 {agent.tweets} 条</p>}
            </article>
          ))}
        </div>
        <p className={s.hint}>{observe?.footnote || agentFootnote()}</p>
        {(observe?.gaps || []).map((gap) => <p key={gap} className={s.hint}>{gap}</p>)}
      </section>

      <section id="more" className={s.section}>
        <h2 className={s.h2}>继续看</h2>
        <RadarTab keyword={keyword} onKeyword={setKeyword} operator={false} heading="按发布时间" />
        <BoardTab operator={false} heading="按时间和指标" />
      </section>
      {signedIn && <p><Link href="/x-workbench/ops">账号与插件</Link></p>}
    </XSiteFrame>
  )
}
