'use client'

import { useCallback, useEffect, useState } from 'react'

import AgentTab from './AgentTab'
import BoardTab from './BoardTab'
import PosterTab from './PosterTab'
import RadarTab from './RadarTab'
import ScheduleTab from './ScheduleTab'
import { call } from './api'
import { WORKBENCH_MENU_GROUPS } from './tabs'
import s from './workbench.module.css'

function TabBar({ tab, onTab }) {
  return (
    <nav className={s.tabs} aria-label="功能">
      {WORKBENCH_MENU_GROUPS.map((group) => (
        <div key={group.id} className={s.menuGroup} role="group" aria-label={group.label}>
          <span className={s.groupLabel}>{group.label}</span>
          {group.items.map((item) => (
            item.href
              ? <a key={item.id} className={s.tab} href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}{item.beta ? <span className={s.beta}>beta</span> : null}</a>
              : <button key={item.id} type="button" className={`${s.tab} ${tab === item.id ? s.tabOn : ''}`} aria-current={tab === item.id ? 'page' : undefined} onClick={() => onTab(item.id)}>{item.label}{item.beta ? <span className={s.beta}>beta</span> : null}</button>
          ))}
        </div>
      ))}
    </nav>
  )
}

export default function WorkbenchClient() {
  const [signedIn, setSignedIn] = useState(false)
  const [tab, setTab] = useState('radar')
  const [accounts, setAccounts] = useState([])
  const [handle, setHandle] = useState('')
  const [usage, setUsage] = useState(null)
  const [posterSeed, setPosterSeed] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')

  const loadUsage = useCallback(async () => {
    const u = await call('/usage')
    if (u.ok) setUsage(u.data)
  }, [])

  const [returnTo, setReturnTo] = useState('https://x.2aran.com/')

  const loadAccounts = useCallback(async () => {
    const res = await call('/accounts')
    if (!res.ok) {
      setSignedIn(false)
      setAccounts([])
      return
    }
    setAccounts(res.data.accounts || [])
    setHandle((cur) => (res.data.accounts.some((a) => a.handle === cur) ? cur : res.data.accounts[0]?.handle || ''))
    setSignedIn(true)
    loadUsage()
  }, [loadUsage])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => {
    setReturnTo(window.location.href)
    const q = new URLSearchParams(window.location.search).get('q') || ''
    if (q) { setQuery(q); setKeyword(q); setTab('radar') }
  }, [])

  const goPoster = (seed) => { setPosterSeed({ ...seed, at: Date.now() }); setTab('poster') }
  const loginHref = `https://2aran.com/login?returnTo=${encodeURIComponent(returnTo)}`
  const needsLogin = !signedIn && (tab === 'agent' || tab === 'poster' || tab === 'schedule')

  const body = needsLogin ? (
    <>
      <h1>登录后使用智能体</h1>
      <p className={s.hint}>推文榜和账号榜不用登录。绑定账号、额度和写操作在登录后可用。</p>
      <a className={`${s.btn} ${s.primary}`} href={loginHref}>登录</a>
    </>
  ) : (
    <>
      {tab === 'radar' && <RadarTab keyword={keyword} onKeyword={(k) => { setKeyword(k); setQuery(k) }} onPoster={signedIn ? goPoster : undefined} signedIn={signedIn} />}
      {tab === 'board' && <BoardTab />}
      {tab === 'poster' && <PosterTab seed={posterSeed} handle={handle} />}
      {tab === 'schedule' && <ScheduleTab handle={handle} seed="" />}
      {tab === 'agent' && <AgentTab accounts={accounts} usage={usage} onAccounts={loadAccounts} />}
    </>
  )

  return (
    <div className={s.app}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <span className={s.brand}><span className={s.logo}>X</span><span className={s.brandName}>X大互动<span className={s.brandSub}>爆点、改写、发布</span></span></span>
          <TabBar tab={tab} onTab={setTab} />
          <form className={s.search} onSubmit={(e) => { e.preventDefault(); setKeyword(query.trim()); setTab('radar') }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜账号、推文关键词" aria-label="搜索" />
            <button type="submit" className={s.searchBtn}>搜索</button>
          </form>
          <a className={s.cta} href="https://2aran.com/resources/x-reply-clipboard-extension">获取插件</a>
          {signedIn ? (
            <select className={s.input} value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="当前 X 账号">
              {accounts.length === 0 && <option value="">未绑定账号</option>}
              {accounts.map((a) => <option key={a.handle} value={a.handle}>@{a.handle}</option>)}
            </select>
          ) : <a className={s.btn} href={loginHref}>登录</a>}
        </div>
      </header>
      <main className={s.main}>{body}</main>
    </div>
  )
}
