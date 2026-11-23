'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { call, message, post } from './api'
import s from './workbench.module.css'

export default function AgentTab({ accounts, usage, onAccounts }) {
  const [pairing, setPairing] = useState(null)
  const [handle, setHandle] = useState('')
  const [active, setActive] = useState('')
  const [persona, setPersona] = useState({ role: '', goal: '', tone: '' })
  const [memory, setMemory] = useState([])
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState('')
  const [pair, setPair] = useState(null)

  const open = useCallback(async (next) => {
    setActive(next)
    setNote('')
    const res = await call(`/profile?handle=${encodeURIComponent(next)}`)
    if (!res.ok) return setNote(message(res.data))
    setPersona({ role: '', goal: '', tone: '', ...res.data.persona })
    setMemory(res.data.memory || [])
  }, [])

  useEffect(() => { if (!active && accounts[0]) open(accounts[0].handle) }, [accounts, active, open])

  async function bind(event) {
    event.preventDefault()
    const res = await post('/accounts', { handle })
    if (!res.ok) return setNote(message(res.data))
    setHandle('')
    await onAccounts()
    open(res.data.handle)
  }

  async function unbind(target) {
    if (!window.confirm(`解绑 @${target} 会同时删除它的人格与记忆，确定吗？`)) return
    await post('/accounts', { handle: target }, 'DELETE')
    if (active === target) setActive('')
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

  async function save() {
    const res = await post('/profile', { handle: active, persona, memory }, 'PUT')
    setNote(res.ok ? '已保存' : message(res.data))
    if (res.ok) setMemory(res.data.memory)
  }

  return (
    <section>
      <h2 className={s.h2}>X 大互动智能体</h2>
      <p className={s.hint}>每个 X 账号一份人格和记忆。改写会读取它们，插件里的智能体也会同步同一份。写入前会按固定原则检查，要求调高上限、缩短冷却、绕开检测的内容会被拒绝。</p>
      <div className={s.card}>
        <div className={s.row}>
          {accounts.map((a) => (
            <span key={a.handle}>
              <button type="button" className={`${s.btn} ${active === a.handle ? s.primary : ''}`} onClick={() => open(a.handle)}>@{a.handle}</button>{' '}
              <button type="button" className={s.btn} aria-label={`解绑 ${a.handle}`} onClick={() => unbind(a.handle)}>×</button>
            </span>
          ))}
          <form onSubmit={bind} className={s.row} style={{ marginBottom: 0 }}>
            <input className={s.input} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="绑定 X 账号名" maxLength={16} />
            <button type="submit" className={s.btn}>绑定</button>
          </form>
        </div>
        <p className={s.note}>绑定只记录账号名，不需要 X 的密码或授权。</p>
      </div>
      <div className={s.card}>
        <h3>连接浏览器插件</h3>
        <p className={s.note}>配对后可在插件工具箱手动提交当前页面的公开推文。正文和公开指标会进入共享雷达。配对码 10 分钟有效，只能使用一次；连接 30 天后过期。</p>
        <button type="button" className={s.btn} onClick={async () => {
          const res = await post('/pairing', {})
          if (res.ok) setPairing(res.data)
          else setNote(message(res.data))
        }}>生成配对码</button>{' '}
        <button type="button" className={s.btn} onClick={async () => {
          const res = await post('/pairing', {}, 'DELETE')
          if (res.ok) { setPairing(null); setNote('所有插件连接已撤销') }
          else setNote(message(res.data))
        }}>撤销所有插件连接</button>
        {pairing && <p><label>复制到插件工具箱<input className={s.input} style={{ width: '100%' }} readOnly value={pairing.code} onFocus={e => e.target.select()} /></label></p>}
      </div>
      {active && (
        <div className={s.card}>
          <h3 style={{ marginTop: 0 }}>@{active}</h3>
          {[['role', '定位', 120], ['goal', '目标', 120], ['tone', '回复方式', 80]].map(([key, label, max]) => (
            <label key={key} style={{ display: 'block', marginBottom: 8 }}>{label}
              <input className={s.input} style={{ display: 'block', width: '100%', boxSizing: 'border-box' }} value={persona[key]} maxLength={max}
                onChange={(e) => setPersona({ ...persona, [key]: e.target.value })} />
            </label>
          ))}
          <h4>记忆（{memory.length} / 30）</h4>
          {memory.map((m, i) => (
            <div key={m.id || i} className={s.rank}>
              <span style={{ flex: 1 }}>{m.text}</span>
              <button type="button" className={s.btn} onClick={() => setMemory(memory.filter((_, j) => j !== i))}>删除</button>
            </div>
          ))}
          <form className={s.row} style={{ marginTop: 8 }} onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim()) { setMemory([...memory, { type: 'account', text: draft.trim(), source: 'user', at: Date.now() }]); setDraft('') }
          }}>
            <input className={s.input} style={{ flex: 1 }} value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)} placeholder="新增一条记忆，例如：不用感叹号" />
            <button type="submit" className={s.btn}>添加</button>
          </form>
          <button type="button" className={`${s.btn} ${s.primary}`} onClick={save}>保存</button>
        </div>
      )}
      <div className={s.card}>
        <strong>连接浏览器插件</strong>
        <p className={s.note}>配对后，插件可以把你在 X 上看到的公开推文（正文和点赞、转发、评论、展示数）提交到推文榜，榜单对所有用户共享。受保护账号的推文不会提交。配对码 10 分钟内有效，只能用一次。</p>
        <ol className={s.note} style={{ paddingLeft: 18 }}>
          <li>在 X 页面打开插件面板，进入工具箱的「X大互动」。</li>
          <li>点下面的按钮生成配对码，粘贴到插件里点「配对」。</li>
          <li>要自动收录，勾选「浏览时自动提交高互动推文」。</li>
        </ol>
        <div className={s.row}>
          <button type="button" className={`${s.btn} ${s.primary}`} onClick={makeCode}>生成配对码</button>
          <button type="button" className={s.btn} onClick={revokeAll}>撤销全部插件连接</button>
        </div>
        {pair && (
          <div className={s.row}>
            <input className={s.input} style={{ flex: 1, fontFamily: 'monospace' }} readOnly value={pair.code} onFocus={(e) => e.target.select()} aria-label="配对码" />
            <button type="button" className={s.btn} onClick={() => navigator.clipboard?.writeText(pair.code)}>复制</button>
            <span className={s.note}>{new Date(pair.expiresAt).toLocaleTimeString()} 前有效</span>
          </div>
        )}
      </div>
      {usage && (
        <div className={s.card}>
          <strong>本月额度（{usage.period}）</strong>
          <div className={s.meta} style={{ marginTop: 6 }}>
            {usage.items.map((i) => <span key={i.kind}>{{ rewrite: 'AI 改写 / 找角度', image: '配图', agent_chat: '智能体对话' }[i.kind]} {i.used}/{i.limit}</span>)}
          </div>
        </div>
      )}
      <p className={s.note}>浏览器插件在 <Link href="/extension">X 大互动智能体插件页</Link> 获取。</p>
      {note && <p role="status" className={s.note}>{note}</p>}
    </section>
  )
}
