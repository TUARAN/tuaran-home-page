'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import BoardTab from './BoardTab'
import RadarTab from './RadarTab'
import XSiteFrame from './XSiteFrame'
import { call, compact } from './api'
import {
  ACTION_LABELS,
  HOT_BOARD_ACCOUNT_NOTE,
  HOT_BOARD_TWEET_NOTE,
  OBSERVED_AGENTS,
  agentFootnote,
} from '../../../lib/x/workbench/observeCore'
import s from './workbench.module.css'

function Metric({ ready, value }) {
  if (!ready) return <span className={s.note}>读取中</span>
  if (value == null) return <span className={s.missing}>未采集</span>
  return compact(value)
}

function rowMetric(row, kind) {
  if (kind === 'tweet') {
    if (row.score != null) return { value: row.score, suffix: '热度' }
    return { value: row.views, suffix: '曝光' }
  }
  if (row.index != null) return { value: row.index, suffix: '指数' }
  return { value: row.views, suffix: '曝光' }
}

function MiniBoard({ title, note, rows, kind }) {
  const max = rows.reduce((m, row) => {
    const metric = rowMetric(row, kind)
    return Math.max(m, Number(metric.value) || 0)
  }, 0) || 1
  return (
    <div className={s.panel}>
      <div className={s.panelHead}><h2>{title}</h2><span>{rows.length ? `${rows.length} 条` : '读取中'}</span></div>
      {!rows.length && <div className={s.empty}>今日还没有数据。</div>}
      {rows.map((row, index) => {
        const metric = rowMetric(row, kind)
        const name = kind === 'tweet' ? (row.handle ? `@${row.handle}` : '未采集') : (row.displayName || `@${row.handle}`)
        const tag = kind === 'tweet' ? (row.category || row.topic || '') : ''
        return (
          <article key={kind === 'tweet' ? row.id : row.handle} className={s.rank}>
            <span className={`${s.rankNo} ${index === 0 ? s.no1 : ''}`}>{index + 1}</span>
            <div className={s.rankMain}>
              <a href={kind === 'tweet' ? row.url : `https://x.com/${row.handle}`} target="_blank" rel="noreferrer noopener" style={{ color: 'inherit' }}>
                <strong>{name}</strong>
              </a>
              {kind === 'tweet' && tag && <div className={s.note}>{tag}</div>}
              {kind === 'tweet' && row.text && <div className={s.note}>{row.text}</div>}
              <div className={s.boardBar}><i style={{ width: `${Math.max(2, Math.round((Number(metric.value) || 0) / max * 100))}%` }} /></div>
            </div>
            <strong>{compact(metric.value)}</strong>
          </article>
        )
      })}
      <details className={s.fold}><summary>统计口径</summary><p className={s.hint}>{note}</p></details>
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
  const hotUnavailable = observe?.radarUnavailable && !(observe?.tweets?.length)
  const tweetConclusion = !observe ? '' : hotUnavailable ? '今日热榜暂时读不到。' : observe.tweetConclusion
  const accountConclusion = !observe ? '' : hotUnavailable ? '今日涨粉榜暂时读不到。' : observe.accountConclusion

  return (
    <XSiteFrame active="/x-workbench">
      <section id="hot" className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionMark} aria-hidden="true" />
          <h2 className={s.sectionTitle}>热榜</h2>
          <span className={s.sectionQ}>简中区今天在聊什么、谁在想稳定出爆款。</span>
        </div>
        {observe?.hotBoardSource && (
          <p className={s.hint}>
            数据源：{observe.hotBoardSource}
            {observe.hotBoardUpdatedAt ? ` · 更新 ${observe.hotBoardUpdatedAt.slice(0, 16).replace('T', ' ')}` : ''}
          </p>
        )}
        {(tweetConclusion || accountConclusion) && (
          <div className={s.noteCard}>
            {tweetConclusion && <p>{tweetConclusion}</p>}
            {accountConclusion && <p>{accountConclusion}</p>}
          </div>
        )}
        <div className={s.cols}>
          <MiniBoard title="推文热榜" note={HOT_BOARD_TWEET_NOTE} rows={observe?.tweets || []} kind="tweet" />
          <MiniBoard title="涨粉潜力" note={HOT_BOARD_ACCOUNT_NOTE} rows={observe?.accounts || []} kind="account" />
        </div>
        <p><Link href="/calendar">往日记录</Link></p>
      </section>

      <section id="agents" className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionMark} aria-hidden="true" />
          <h2 className={s.sectionTitle}>大互动智能体</h2>
        </div>
        <p className={s.question}>使用了智能体插件的账号，今天做了什么。</p>
        <p className={s.hint}>目前是矿工阿三、矿长阿富、矿工小十三。</p>
        <div className={s.agentGrid}>
          {agents.map((agent) => (
            <article key={agent.handle} className={s.agentCard}>
              <h3 style={{ margin: 0 }}>{agent.name || agent.handle}</h3>
              <a href={`https://x.com/${agent.handle}`} target="_blank" rel="noreferrer noopener" className={s.note}>@{agent.handle}</a>
              <div className={s.agentMain}><b><Metric ready={ready} value={agent.actions?.posts ?? null} /></b><span className={s.note}>发帖</span></div>
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
        <details className={s.fold}><summary>统计口径</summary><p className={s.hint}>{observe?.footnote || agentFootnote()}</p></details>
        {(observe?.gaps || []).map((gap) => <p key={gap} className={s.hint}>{gap}</p>)}
      </section>

      <section id="more" className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionMark} aria-hidden="true" />
          <h2 className={s.sectionTitle}>继续看</h2>
        </div>
        <RadarTab keyword={keyword} onKeyword={setKeyword} operator={false} heading="按发布时间" />
        <BoardTab operator={false} heading="按时间和指标" />
      </section>
      {signedIn && <p><Link href="/x-workbench/ops">账号与插件</Link></p>}
    </XSiteFrame>
  )
}