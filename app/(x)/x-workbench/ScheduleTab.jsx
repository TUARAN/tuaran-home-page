'use client'

import { useCallback, useEffect, useState } from 'react'

import { call, message, post } from './api'
import s from './workbench.module.css'

function localInput(ms) {
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

export default function ScheduleTab({ handle, seed }) {
  const [drafts, setDrafts] = useState([])
  const [queue, setQueue] = useState([])
  const [text, setText] = useState('')
  const [at, setAt] = useState(localInput(Date.now() + 3600_000))
  const [jitter, setJitter] = useState(0)
  const [note, setNote] = useState('')

  useEffect(() => { if (seed) setText(seed) }, [seed])

  const load = useCallback(async () => {
    if (!handle) return
    const [d, q] = await Promise.all([call(`/drafts?handle=${handle}`), call(`/schedules?handle=${handle}`)])
    if (d.ok) setDrafts(d.data.drafts)
    if (q.ok) setQueue(q.data.schedules)
  }, [handle])

  useEffect(() => { load() }, [load])

  if (!handle) return <section><h2 className={s.h2}>排期</h2><p className={s.hint}>请先在右上角选择 X 账号，没有账号的话到「智能体」里绑定。</p></section>

  async function saveDraft() {
    const res = await post('/drafts', { handle, text })
    setNote(res.ok ? '已存为草稿' : message(res.data))
    load()
  }

  async function schedule() {
    const offset = jitter > 0 ? Math.floor(Math.random() * jitter * 60000) : 0
    const res = await post('/schedules', { handle, text, runAt: new Date(at).getTime() + offset })
    setNote(res.ok ? '已加入排期，由插件在到点后领取并发布' : message(res.data))
    if (res.ok) setText('')
    load()
  }

  return (
    <section>
      <h2 className={s.h2}>草稿与定时发布</h2>
      <p className={s.hint}>云端只负责排队。到点后由你电脑上的插件领取，在 X 页面里按本机的上限与冷却执行；插件没开着就不会发。</p>
      <div className={s.card}>
        <textarea className={`${s.input} ${s.area}`} style={{ minHeight: 100 }} placeholder="帖子正文（单条最多 140 个汉字或 280 个英文字符）" value={text} onChange={(e) => setText(e.target.value)} />
        <div className={s.row} style={{ marginTop: 8 }}>
          <input className={s.input} type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} aria-label="发布时间" />
          <label>随机延后 <input className={s.input} style={{ width: 70 }} type="number" min={0} max={120} value={jitter} onChange={(e) => setJitter(Number(e.target.value) || 0)} /> 分钟内</label>
          <button type="button" className={s.btn} disabled={!text} onClick={saveDraft}>存草稿</button>
          <button type="button" className={`${s.btn} ${s.primary}`} disabled={!text} onClick={schedule}>加入排期</button>
        </div>
        {note && <p role="status" className={s.note}>{note}</p>}
      </div>
      <h3>排期队列（{queue.length}）</h3>
      {queue.map((q) => (
        <div key={q.id} className={s.card}>
          <div className={s.meta}><span>{new Date(q.run_at).toLocaleString()}</span><span className={s.chip}>{q.status === 'claimed' ? '插件执行中' : '等待中'}</span></div>
          <p className={s.postText}>{q.text}</p>
          {q.status === 'queued' && <button type="button" className={s.btn} onClick={async () => { await post('/schedules', { id: q.id }, 'DELETE'); load() }}>取消</button>}
        </div>
      ))}
      <h3>草稿（{drafts.length}）</h3>
      {drafts.map((d) => (
        <div key={d.id} className={s.card}>
          <p className={s.postText}>{d.text}</p>
          <div className={s.row} style={{ marginBottom: 0 }}>
            <button type="button" className={s.btn} onClick={() => setText(d.text)}>载入</button>
            <button type="button" className={s.btn} onClick={async () => { await post('/drafts', { id: d.id }, 'DELETE'); load() }}>删除</button>
          </div>
        </div>
      ))}
    </section>
  )
}
