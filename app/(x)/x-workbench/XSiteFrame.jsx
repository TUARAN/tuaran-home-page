'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { WORKBENCH_MENU_GROUPS } from './tabs'
import s from './workbench.module.css'

export default function XSiteFrame({ active, children }) {
  const [returnTo, setReturnTo] = useState('https://x.2aran.com/')
  useEffect(() => { setReturnTo(window.location.href) }, [])
  const loginHref = `https://2aran.com/login?returnTo=${encodeURIComponent(returnTo)}`
  return (
    <div className={`${s.app} ${s.xFrame}`}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <Link className={s.brand} href="/x-workbench"><span className={s.logo}>X</span><span className={s.brandName}>X大互动<span className={s.brandSub}>观察、跟进、智能</span></span></Link>
          <nav className={s.tabs} aria-label="功能">
            {WORKBENCH_MENU_GROUPS.map((group) => (
              <div key={group.id} className={s.menuGroup} role="group" aria-label={group.label}>
                <span className={s.groupLabel}>{group.label}</span>
                {group.items.map((item) => {
                  const href = item.href || '/x-workbench'
                  const on = href === active
                  const className = `${s.tab} ${on ? s.tabOn : ''}`
                  const label = <>{item.label}{item.beta ? <span className={s.beta}>beta</span> : null}</>
                  return item.external
                    ? <a key={item.id} className={className} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                    : <Link key={item.id} className={className} href={href} aria-current={on ? 'page' : undefined}>{label}</Link>
                })}
              </div>
            ))}
          </nav>
          <form className={s.search} action="/x-workbench">
            <input name="q" placeholder="搜账号、推文关键词" aria-label="搜索" />
            <button type="submit" className={s.searchBtn}>搜索</button>
          </form>
          <Link className={s.cta} href="/extension">获取插件</Link>
          <a className={s.btn} href={loginHref}>登录</a>
        </div>
      </header>
      <main className={s.main}>{children}</main>
    </div>
  )
}
