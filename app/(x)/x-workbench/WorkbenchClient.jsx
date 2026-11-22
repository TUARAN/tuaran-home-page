'use client'

import { useCallback, useEffect, useState } from 'react'

import AgentTab from './AgentTab'
import BoardTab from './BoardTab'
import PosterTab from './PosterTab'
import RadarTab from './RadarTab'
import RewriteTab from './RewriteTab'
import ScheduleTab from './ScheduleTab'
import { call } from './api'
import { WORKBENCH_PAGE_TABS, WORKBENCH_TOOL_TABS } from './tabs'
import s from './workbench.module.css'

function TabBar({ tab, onTab }) {
  return (
    <nav className={s.tabs} aria-label="功能">
      {WORKBENCH_TOOL_TABS.map((item) => (
        <button key={item.id} type="button" className={`${s.tab} ${tab === item.id ? s.tabOn : ''}`} aria-current={tab === item.id ? 'page' : undefined} onClick={() => onTab(item.id)}>{item.label}</button>
      ))}
      {WORKBENCH_PAGE_TABS.map((item) => (
        <a key={item.id} className={s.tab} href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>
      ))}
    </nav>
  )
}

export default function WorkbenchClient() {
  const [state, setState] = useState('loading')
  const [tab, setTab] = useState('radar')
  const [accounts, setAccounts] = useState([])
  const [handle, setHandle] = useState('')
  const [usage, setUsage] = useState(null)
  const [rewriteSeed, setRewriteSeed] = useState('')
  const [posterSeed, setPosterSeed] = useState(null)
  const [draftSeed, setDraftSeed] = useState('')
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')

  const loadUsage = useCallback(async () => {
    const u = await call('/usage')
    if (u.ok) setUsage(u.data)
  }, [])

  const loadAccounts = useCallback(async () => {
    const res = await call('/accounts')
    if (res.status === 401) return setState('anonymous')
    if (!res.ok) return setState('error')
    setAccounts(res.data.accounts || [])
    setHandle((cur) => (res.data.accounts.some((a) => a.handle === cur) ? cur : res.data.accounts[0]?.handle || ''))
    setState('ready')
    loadUsage()
  }, [loadUsage])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const goRewrite = (text) => { setRewriteSeed(text); setTab('rewrite') }
  const goPoster = (seed) => { setPosterSeed({ ...seed, at: Date.now() }); setTab('poster') }
  const goDraft = (text) => { setDraftSeed(text); setTab('schedule') }
  const ready = state === 'ready'

  let body = <p>加载中…</p>
  if (state === 'error') body = <p>服务暂时不可用，请稍后刷新。</p>
  if (state === 'anonymous') {
    const back = encodeURIComponent('https://x.2aran.com/')
    body = (
      <>
        <h1>看见爆点，写出自己的版本</h1>
        <p className={s.hint}>爆文雷达、AI 改写和智能体需要登录。理论、黄皮书、日历、圆桌和 AI分发大师可以直接打开。</p>
        <a className={`${s.btn} ${s.primary}`} href={`https://2aran.com/login?returnTo=${back}`}>登录</a>
      </>
    )
  }
  if (ready) {
    body = (
      <>
        {tab === 'radar' && <RadarTab keyword={keyword} onKeyword={(k) => { setKeyword(k); setQuery(k) }} onRewrite={goRewrite} onPoster={goPoster} />}
        {tab === 'board' && <BoardTab />}
        {tab === 'rewrite' && <RewriteTab seed={rewriteSeed} handle={handle} onUsed={loadUsage} onDraft={goDraft} onPoster={goPoster} />}
        {tab === 'poster' && <PosterTab seed={posterSeed} handle={handle} />}
        {tab === 'schedule' && <ScheduleTab handle={handle} seed={draftSeed} />}
        {tab === 'agent' && <AgentTab accounts={accounts} usage={usage} onAccounts={loadAccounts} />}
      </>
    )
  }

  return (
    <div className={s.app}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <span className={s.brand}><span className={s.logo}>X</span><span className={s.brandName}>X大互动<span className={s.brandSub}>爆点、改写、发布</span></span></span>
          <TabBar tab={ready ? tab : ''} onTab={setTab} />
          {ready ? (
            <>
              <form className={s.search} onSubmit={(e) => { e.preventDefault(); setKeyword(query.trim()); setTab('radar') }}>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜账号、推文关键词" aria-label="搜索" />
                <button type="submit" className={s.searchBtn}>搜索</button>
              </form>
              <a className={s.cta} href="https://2aran.com/resources/x-reply-clipboard-extension">获取插件</a>
              <select className={s.input} value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="当前 X 账号">
                {accounts.length === 0 && <option value="">未绑定账号</option>}
                {accounts.map((a) => <option key={a.handle} value={a.handle}>@{a.handle}</option>)}
              </select>
            </>
          ) : null}
        </div>
      </header>
      <main className={s.main}>{body}</main>
    </div>
  )
}
