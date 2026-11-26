'use client'

import Link from 'next/link'
import { useState } from 'react'

import { message, post } from './api'
import s from './workbench.module.css'

export default function AgentTab({ accounts, active, onSelect, onAccounts }) {
  const [handle, setHandle] = useState('')
  const [note, setNote] = useState('')
  const [pair, setPair] = useState(null)

  async function bind(event) {
    event.preventDefault()
    const res = await post('/accounts', { handle })
    if (!res.ok) return setNote(message(res.data))
    setHandle('')
    await onAccounts()
    onSelect(res.data.handle)
  }

  async function unbind(target) {
    if (!window.confirm(`确定解绑 @${target} 吗？`)) return
    const res = await post('/accounts', { handle: target }, 'DELETE')
    if (!res.ok) return setNote(message(res.data))
    onAccounts()
  }

  async function makeCode() {
    const res = await post('/pairing', {})
    if (res.ok) setPair(res.data)
    else setNote(message(res.data))
  }

  async function revokeAll() {
    if (!window.confirm('撤销后，所有已配对的浏览器都需要重新配对，确定吗？')) return
    const res = await post('/pairing', {}, 'DELETE')
    setPair(null)
    setNote(res.ok ? '已撤销全部插件连接' : message(res.data))
  }

  return (
    <section className={s.opsStack}>
      {note && <p role="status" className={s.opsStatus}>{note}</p>}

      <section className={s.panel}>
        <div className={s.panelHead}>
          <h2>账号</h2>
          <span>{accounts.length ? `已绑定 ${accounts.length} 个` : '尚未绑定'}</span>
        </div>
        {accounts.length > 0 && (
          <div className={s.accountChips}>
            {accounts.map((a) => (
              <span key={a.handle} className={`${s.accountChip} ${active === a.handle ? s.accountChipOn : ''}`}>
                <button type="button" className={s.accountPick} aria-pressed={active === a.handle} onClick={() => onSelect(a.handle)}>@{a.handle}</button>
                <button type="button" className={s.accountDrop} aria-label={`解绑 ${a.handle}`} onClick={() => unbind(a.handle)}>×</button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={bind} className={s.bindForm}>
          <input className={s.input} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="X 账号名，不带 @" maxLength={16} aria-label="绑定 X 账号名" />
          <button type="submit" className={`${s.btn} ${s.primary}`} disabled={!handle.trim()}>绑定</button>
        </form>
        <p className={`${s.note} ${s.panelNote}`}>绑定只记录账号名，不需要 X 的密码或授权。人格与记忆在插件本地设置。</p>
      </section>

      <section className={s.panel}>
        <div className={s.panelHead}>
          <h2>连接浏览器插件</h2>
          <span>配对码 10 分钟有效，只能用一次</span>
        </div>
        <p className={s.note}>配对后，插件可以把你在 X 上看到的公开推文（正文和点赞、转发、评论、展示数）提交到推文榜，榜单对所有用户共享。受保护账号的推文不会提交。</p>
        <ol className={s.opsSteps}>
          <li className={s.step}><b>1. 打开插件</b>在 X 页面打开插件面板，进入工具箱的「X大互动」。</li>
          <li className={s.step}><b>2. 粘贴配对码</b>点下面的按钮生成配对码，粘贴到插件里点「配对」。</li>
          <li className={s.step}><b>3. 自动收录（可选）</b>勾选「浏览时自动提交高互动推文」。</li>
        </ol>
        <div className={s.pairRow}>
          {pair ? (
            <>
              <input className={`${s.input} ${s.pairCode}`} readOnly value={pair.code} onFocus={(e) => e.target.select()} aria-label="配对码" />
              <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => navigator.clipboard?.writeText(pair.code).then(() => setNote('配对码已复制'))}>复制</button>
              <span className={s.pairNote}>{new Date(pair.expiresAt).toLocaleTimeString()} 前有效</span>
            </>
          ) : (
            <button type="button" className={`${s.btn} ${s.primary}`} onClick={makeCode}>生成配对码</button>
          )}
          <button type="button" className={`${s.link} ${s.pairRevoke}`} onClick={revokeAll}>撤销全部插件连接</button>
        </div>
        <p className={s.opsLinks}>
          <Link href="/extension">获取浏览器插件</Link>
          <Link href="/docs">大互动智能体手册</Link>
        </p>
      </section>
    </section>
  )
}
