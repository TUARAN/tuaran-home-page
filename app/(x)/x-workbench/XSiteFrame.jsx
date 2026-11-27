'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { sessionUserLabel, useSharedSession } from './sharedSession'
import { WORKBENCH_MENU_GROUPS } from './tabs'
import s from './workbench.module.css'

export default function XSiteFrame({ active, children }) {
  const { loading, user, signedIn } = useSharedSession()
  const [returnTo, setReturnTo] = useState('https://x.2aran.com/')
  const [hash, setHash] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    setReturnTo(window.location.href)
    const read = () => setHash(window.location.hash || '')
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  // 账号菜单：点外部或按 Esc 收起，避免 H5 上弹层挡内容
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])
  const loginHref = `https://2aran.com/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `https://2aran.com/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const accountLabel = sessionUserLabel(user)
  const initial = (accountLabel || '?').trim().slice(0, 1).toUpperCase()
  return (
    <div className={`${s.app} ${s.xFrame}`}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <Link className={s.brand} href="/x-workbench">
            <span className={s.logo}>X</span>
            <span className={s.brandCopy}>
              <span className={s.brandName}>X大互动</span>
              <span className={s.brandSlogan} role="doc-subtitle">
                <span className={s.brandSloganShine} aria-hidden="true" />
                <span className={s.brandSloganText}>
                  帮助一批智能体<strong className={s.brandSloganEm}>拿到创作者收益</strong>
                </span>
              </span>
            </span>
          </Link>
          <nav className={s.tabs} aria-label="功能">
            {WORKBENCH_MENU_GROUPS.map((group) => (
              <div key={group.id} className={s.menuGroup} role="group" aria-label={group.label}>
                <span className={s.groupLabel}>{group.label}</span>
                {group.items.map((item) => {
                  const href = item.href || '/x-workbench'
                  const section = href.includes('#')
                  const on = href === active || (active === '/x-workbench' && section && href.endsWith(hash || '#agents'))
                  const className = `${s.tab} ${on ? s.tabOn : ''}`
                  const label = <>{item.label}{item.beta ? <span className={s.beta}>beta</span> : null}</>
                  return item.external
                    ? <a key={item.id} className={className} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                    : <Link key={item.id} className={className} href={href} aria-current={on ? 'page' : undefined}>{label}</Link>
                })}
              </div>
            ))}
          </nav>
          <div className={s.barActions}>
            <Link className={s.hdrPrimary} href="/extension">获取插件</Link>
            {loading ? <span className={s.hdrLoading} aria-hidden="true" /> : null}
            {!loading && signedIn ? (
              <div className={s.accountWrap} ref={menuRef}>
                <button type="button" className={s.avatarBtn} aria-haspopup="menu" aria-expanded={menuOpen} aria-label={`账号菜单：${accountLabel}`} onClick={() => setMenuOpen((open) => !open)}>{initial}</button>
                {menuOpen ? (
                  <div className={s.accountMenu} role="menu">
                    <p className={s.menuWho}>已登录 · {accountLabel}</p>
                    <a className={s.menuItem} role="menuitem" href="https://2aran.com/account">账号与订阅</a>
                    <Link className={s.menuItem} role="menuitem" href="/x-workbench/ops">站长后台<span className={s.beta}>开发中</span></Link>
                    <a className={`${s.menuItem} ${s.menuExit}`} role="menuitem" href={logoutHref}>退出登录</a>
                  </div>
                ) : null}
              </div>
            ) : null}
            {!loading && !signedIn ? <a className={s.hdrGhost} href={loginHref}>登录</a> : null}
          </div>
        </div>
      </header>
      <main className={s.main}>{children}</main>
    </div>
  )
}
