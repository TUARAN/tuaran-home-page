'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import BoardTab from './BoardTab'
import RadarTab from './RadarTab'
import XSiteFrame from './XSiteFrame'
import { call, compact } from './api'
import {
  ACTION_LABELS,
  METRIC_LABELS,
  OBSERVED_AGENTS,
  THEORY_POINTS,
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

export default function WorkbenchClient() {
  const [view, setView] = useState('tweets')
  const [keyword, setKeyword] = useState('')
  const [observe, setObserve] = useState(null)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || ''
    if (q) { setKeyword(q); setView('tweets') }
    call('/accounts').then((res) => setSignedIn(Boolean(res.ok)))
    call('/observe').then((res) => setObserve(res.ok ? res.data : { unavailable: true, agents: [], tweets: [], gaps: [] }))
  }, [])

  const ready = Boolean(observe)
  const agents = observe?.agents?.length ? observe.agents : OBSERVED_AGENTS
  const tweetConclusion = !observe ? '' : observe.unavailable ? '今日曝光结论暂时读不到。' : observe.tweetConclusion

  return (
    <XSiteFrame active="/x-workbench">
      <section id="market" className={s.section}>
        <h2 className={s.h2}>市场流量</h2>
        <p className={s.question}>今天流量去哪了。</p>
        <div className={s.row}>
          <button type="button" className={`${s.btn} ${view === 'tweets' ? s.primary : ''}`} onClick={() => setView('tweets')}>推文观察</button>
          <button type="button" className={`${s.btn} ${view === 'accounts' ? s.primary : ''}`} onClick={() => setView('accounts')}>账号观察</button>
        </div>
        {view === 'tweets' && (
          <>
            {tweetConclusion && <p className={s.conclusion}>{tweetConclusion}</p>}
            {observe && !observe.unavailable && <p className={s.hint}>{TWEET_BOARD_NOTE}</p>}
            <TweetBoard items={observe?.tweets || []} />
            <RadarTab keyword={keyword} onKeyword={setKeyword} operator={false} heading="按发布时间继续看" />
          </>
        )}
        {view === 'accounts' && <BoardTab operator={false} />}
      </section>

      <section id="agents" className={s.section}>
        <h2 className={s.h2}>智能体表现</h2>
        <p className={s.question}>矿工阿三、矿长阿富、矿工小十三今天的发帖、互动和推文表现。</p>
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

      <section id="basis" className={s.section}>
        <h2 className={s.h2}>理论基础</h2>
        <p className={s.question}>大互动理论把一次交流收成可以核对的过程：主动接触，说出判断，听见回应，再按反馈调整。</p>
        <div className={s.theoryGrid}>
          {THEORY_POINTS.map((point) => (
            <article key={point.title} className={s.card}>
              <h3 style={{ margin: '0 0 8px' }}>{point.title}</h3>
              <p style={{ margin: '0 0 8px' }}>{point.text}</p>
              <p className={s.note}>对照智能体表现：{point.metrics.map((key) => METRIC_LABELS[key]).join('、')}</p>
              <a href={point.href}>{point.hrefLabel}</a>
            </article>
          ))}
        </div>
        <p>
          <a href="https://2aran.com/resources/big-interaction-whitepaper">大互动理论绿皮书</a>
          {' · '}
          <a href="https://2aran.com/resources/big-interaction-whitepaper/roundtable">大互动圆桌</a>
        </p>
      </section>
      {signedIn && <p><Link href="/x-workbench/ops">账号与插件</Link></p>}
    </XSiteFrame>
  )
}
