'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { call, message, post } from './api'
import s from './workbench.module.css'

const PERSONA_FIELDS = [
  ['role', '定位', 120, '例如：独立开发者，记录做产品的过程'],
  ['goal', '目标', 120, '例如：每周认识 5 位同领域创作者'],
  ['tone', '回复方式', 80, '例如：短句、具体、不用感叹号'],
]
const USAGE_LABELS = { rewrite: 'AI 改写 / 找角度', image: '配图', agent_chat: '智能体对话' }
const MEMORY_LIMIT = 30

export default function AgentTab({ accounts, usage, active, onSelect, onAccounts }) {
  const [handle, setHandle] = useState('')
  const [persona, setPersona] = useState({ role: '', goal: '', tone: '' })
  const [memory, setMemory] = useState([])
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState('')
  const [pair, setPair] = useState(null)

  const load = useCallback(async (target) => {
    setNote('')
    setPersona({ role: '', goal: '', tone: '' })
    setMemory([])
    if (!target) return
    const res = await call(`/profile?handle=${encodeURIComponent(target)}`)
    if (!res.ok) return setNote(message(res.data))
    setPersona({ role: '', goal: '', tone: '', ...res.data.persona })
    setMemory(res.data.memory || [])
  }, [])

  useEffect(() => { load(active) }, [active, load])

  async function bind(event) {
    event.preventDefault()
    const res = await post('/accounts', { handle })
    if (!res.ok) return setNote(message(res.data))
    setHandle('')
    await onAccounts()
    onSelect(res.data.handle)
  }

  async function unbind(target) {
    if (!window.confirm(`解绑 @${target} 会同时删除它的人格与记忆，确定吗？`)) return
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

  async function save() {
    const res = await post('/profile', { handle: active, persona, memory }, 'PUT')
    setNote(res.ok ? `@${active} 的人格与记忆已保存` : message(res.data))
    if (res.ok) setMemory(res.data.memory)
  }

  function addMemory(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || memory.length >= MEMORY_LIMIT) return
    setMemory([...memory, { type: 'account', text, source: 'user', at: Date.now() }])
    setDraft('')
  }

  return (
    <section>
      {note && <p role="status" className={s.opsStatus}>{note}</p>}

      <div className={s.opsGrid}>
        <div className={s.opsSide}>
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
            <p className={`${s.note} ${s.panelNote}`}>绑定只记录账号名，不需要 X 的密码或授权。</p>
          </section>

          {usage && (
            <section className={s.panel}>
              <div className={s.panelHead}>
                <h2>本月额度</h2>
                <span>{usage.period}</span>
              </div>
              <dl className={`${s.metricRow} ${s.opsMetrics}`}>
                {usage.items.map((i) => (
                  <div key={i.kind} className={s.metricCell}>
                    <dd>{i.used}<small className={s.metricLimit}> / {i.limit}</small></dd>
                    <dt>{USAGE_LABELS[i.kind] || i.kind}</dt>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>{active ? `@${active} 的人格与记忆` : '人格与记忆'}</h2>
            {active && <span>改写与插件共用</span>}
          </div>
          {!active && <p className={s.opsEmpty}>先在左侧绑定一个 X 账号，再为它设置定位、目标和回复方式。</p>}
          {active && (
            <>
              <div className={s.fieldGrid}>
                {PERSONA_FIELDS.map(([key, label, max, placeholder]) => (
                  <label key={key} className={s.fieldLabel}>{label}
                    <input className={`${s.input} ${s.fieldInput}`} value={persona[key]} maxLength={max} placeholder={placeholder}
                      onChange={(e) => setPersona({ ...persona, [key]: e.target.value })} />
                  </label>
                ))}
              </div>
              <h3 className={s.subHead}>记忆 <span className={s.subCount}>{memory.length} / {MEMORY_LIMIT}</span></h3>
              {memory.length > 0 && (
                <ul className={s.memoryList}>
                  {memory.map((m, i) => (
                    <li key={m.id || i} className={s.memoryItem}>
                      <span className={s.memoryText}>{m.text}</span>
                      <button type="button" className={s.link} onClick={() => setMemory(memory.filter((_, j) => j !== i))}>删除</button>
                    </li>
                  ))}
                </ul>
              )}
              <form className={s.memoryRow} onSubmit={addMemory}>
                <input className={`${s.input} ${s.memoryInput}`} value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)} placeholder="新增一条记忆，例如：不用感叹号" aria-label="新增记忆" />
                <button type="submit" className={s.btn} disabled={!draft.trim() || memory.length >= MEMORY_LIMIT}>添加</button>
              </form>
              <p className={`${s.note} ${s.panelNote}`}>写入前会按固定原则检查，要求调高上限、缩短冷却、绕开检测的内容会被拒绝。</p>
              <div className={s.panelFoot}>
                <button type="button" className={`${s.btn} ${s.primary}`} onClick={save}>保存</button>
              </div>
            </>
          )}
        </section>
      </div>

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
