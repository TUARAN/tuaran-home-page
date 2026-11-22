'use client'

import { useCallback, useEffect, useState } from 'react'

import AgentTab from './AgentTab'
import BoardTab from './BoardTab'
import PosterTab from './PosterTab'
import RadarTab from './RadarTab'
import RewriteTab from './RewriteTab'
import ScheduleTab from './ScheduleTab'
import { call } from './api'
import s from './workbench.module.css'

const TABS = [['radar', '推文榜'], ['board', '账号榜'], ['rewrite', 'AI 改写'], ['poster', '海报'], ['schedule', '排期'], ['agent', '智能体']]

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

  if (state === 'loading') return <div className={s.app}><main className={s.main}>加载中…</main></div>
  if (state === 'error') return <div className={s.app}><main className={s.main}>服务暂时不可用，请稍后刷新。</main></div>
  if (state === 'anonymous') {
    const back = encodeURIComponent('https://x.2aran.com/')
    return (
      <div className={s.app}>
        <main className={s.main}>
          <h1>看见爆点，写出自己的版本</h1>
          <p className={s.hint}>爆文雷达、AI 改写、海报、定时发布，加一个会按你的账号习惯做互动的智能体。使用 2aran.com 账号登录。</p>
          <a className={`${s.btn} ${s.primary}`} href={`https://2aran.com/login?returnTo=${back}`}>登录</a>
        </main>
      </div>
    )
  }

  const goRewrite = (text) => { setRewriteSeed(text); setTab('rewrite') }
  const goPoster = (seed) => { setPosterSeed({ ...seed, at: Date.now() }); setTab('poster') }
  const goDraft = (text) => { setDraftSeed(text); setTab('schedule') }

  return (
    <div className={s.app}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <span className={s.brand}><span className={s.logo}>X</span><span className={s.brandName}>X大互动<span className={s.brandSub}>爆点、改写、发布</span></span></span>
          <nav className={s.tabs} aria-label="功能">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" className={`${s.tab} ${tab === k ? s.tabOn : ''}`} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{label}</button>
            ))}
          </nav>
          <form className={s.search} onSubmit={(e) => { e.preventDefault(); setKeyword(query.trim()); setTab('radar') }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜账号、推文关键词" aria-label="搜索" />
            <button type="submit" className={s.searchBtn}>搜索</button>
          </form>
          <a className={s.cta} href="https://2aran.com/resources/x-reply-clipboard-extension">获取插件</a>
          <select className={s.input} value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="当前 X 账号">
            {accounts.length === 0 && <option value="">未绑定账号</option>}
            {accounts.map((a) => <option key={a.handle} value={a.handle}>@{a.handle}</option>)}
          </select>
        </div>
      </header>
      <main className={s.main}>
        {tab === 'radar' && <RadarTab keyword={keyword} onKeyword={(k) => { setKeyword(k); setQuery(k) }} onRewrite={goRewrite} onPoster={goPoster} />}
        {tab === 'board' && <BoardTab />}
        {tab === 'rewrite' && <RewriteTab seed={rewriteSeed} handle={handle} onUsed={loadUsage} onDraft={goDraft} onPoster={goPoster} />}
        {tab === 'poster' && <PosterTab seed={posterSeed} handle={handle} />}
        {tab === 'schedule' && <ScheduleTab handle={handle} seed={draftSeed} />}
        {tab === 'agent' && <AgentTab accounts={accounts} usage={usage} onAccounts={loadAccounts} />}
      </main>
    </div>
  )
}
