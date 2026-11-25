'use client'

import { useCallback, useEffect, useState } from 'react'

import AgentTab from './AgentTab'
import XSiteFrame from './XSiteFrame'
import { call } from './api'
import s from './workbench.module.css'

export default function OperatorClient() {
  const [signedIn, setSignedIn] = useState(false)
  const [ready, setReady] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [handle, setHandle] = useState('')
  const [usage, setUsage] = useState(null)
  const [returnTo, setReturnTo] = useState('https://x.2aran.com/x-workbench/ops')

  const loadUsage = useCallback(async () => {
    const usageResult = await call('/usage')
    if (usageResult.ok) setUsage(usageResult.data)
  }, [])

  const loadAccounts = useCallback(async () => {
    const res = await call('/accounts')
    if (!res.ok) {
      setSignedIn(false)
      setAccounts([])
      setReady(true)
      return
    }
    setAccounts(res.data.accounts || [])
    setHandle((current) => (res.data.accounts.some((account) => account.handle === current) ? current : res.data.accounts[0]?.handle || ''))
    setSignedIn(true)
    setReady(true)
    loadUsage()
  }, [loadUsage])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { setReturnTo(window.location.href) }, [])

  const loginHref = `https://2aran.com/login?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <XSiteFrame active="/x-workbench">
      {!ready && <p className={s.hint}>读取中</p>}
      {ready && !signedIn && (
        <section className={s.card}>
          <h1 className={s.h2}>登录后继续</h1>
          <a className={`${s.btn} ${s.primary}`} href={loginHref}>登录</a>
        </section>
      )}
      {ready && signedIn && (
        <>
          <header className={s.opsHead}>
            <div className={s.opsIntro}>
              <h1 className={s.opsTitle}>X 大互动智能体</h1>
              <p className={s.hint}>每个 X 账号一份人格和记忆。改写会读取它们，插件里的智能体也会同步同一份。</p>
            </div>
            {accounts.length > 0 && (
              <label className={s.accountRow}>
                <span className={s.accountLabel}>当前 X 账号</span>
                <select className={`${s.input} ${s.accountSelect}`} value={handle} onChange={(event) => setHandle(event.target.value)}>
                  {accounts.map((account) => <option key={account.handle} value={account.handle}>@{account.handle}</option>)}
                </select>
              </label>
            )}
          </header>
          <AgentTab accounts={accounts} usage={usage} active={handle} onSelect={setHandle} onAccounts={loadAccounts} />
        </>
      )}
    </XSiteFrame>
  )
}
