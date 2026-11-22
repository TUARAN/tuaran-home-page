'use client'

import { useEffect, useState } from 'react'

import { message, post } from './api'
import s from './workbench.module.css'

const STYLES = [['standard', '标准改写'], ['hook', '钩子开头'], ['title', '标题公式'], ['story', '叙事表达'], ['flash', '热点快讯'], ['viral', 'X 爆文体']]

export default function RewriteTab({ seed, handle, onUsed, onDraft, onPoster }) {
  const [source, setSource] = useState('')
  const [style, setStyle] = useState('standard')
  const [length, setLength] = useState(140)
  const [extra, setExtra] = useState('')
  const [result, setResult] = useState('')
  const [angles, setAngles] = useState([])
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => { if (seed) setSource(seed) }, [seed])

  async function run(action) {
    setBusy(action)
    setNote('')
    const res = await post('/rewrite', { action, source, style, length, extra, handle })
    setBusy('')
    if (!res.ok) return setNote(message(res.data))
    if (action === 'angles') setAngles(res.data.angles)
    else setResult(res.data.text)
    onUsed()
  }

  return (
    <section>
      <h2 className={s.h2}>AI 改写</h2>
      <p className={s.hint}>把素材改写成你自己的帖子。选了账号时会带上该账号的人格与记忆。需要你亲身经验的地方会留占位，发之前请补上。</p>
      <div className={s.two}>
        <div>
          <textarea className={`${s.input} ${s.area}`} placeholder="粘贴素材：一条推文、一段文字" value={source} maxLength={4000} onChange={(e) => setSource(e.target.value)} />
          <div className={s.row} style={{ marginTop: 8 }}>
            <select className={s.input} value={style} onChange={(e) => setStyle(e.target.value)} aria-label="写作风格">
              {STYLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <label>约 <input className={s.input} style={{ width: 80 }} type="number" min={50} max={1000} step={10} value={length} onChange={(e) => setLength(e.target.value)} /> 字</label>
          </div>
          <input className={`${s.input}`} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="附加要求（可选）" value={extra} maxLength={200} onChange={(e) => setExtra(e.target.value)} />
          <div className={s.row} style={{ marginTop: 8 }}>
            <button type="button" className={s.btn} disabled={!!busy} onClick={() => run('angles')}>{busy === 'angles' ? '思考中…' : '找角度'}</button>
            <button type="button" className={`${s.btn} ${s.primary}`} disabled={!!busy} onClick={() => run('rewrite')}>{busy === 'rewrite' ? '改写中…' : '改写'}</button>
          </div>
          {angles.map((a) => (
            <button key={a.title} type="button" className={s.card} style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setExtra(`从「${a.title}」这个角度写：${a.pitch}`.slice(0, 200))}>
              <strong>{a.title}</strong><div className={s.note}>{a.pitch}</div>
            </button>
          ))}
        </div>
        <div>
          <textarea className={`${s.input} ${s.area}`} placeholder="改写结果会显示在这里，可直接修改" value={result} onChange={(e) => setResult(e.target.value)} />
          <div className={s.row} style={{ marginTop: 8 }}>
            <span className={s.note}>{Array.from(result).length} 字</span>
            <button type="button" className={s.btn} disabled={!result} onClick={() => navigator.clipboard?.writeText(result)}>复制</button>
            <button type="button" className={s.btn} disabled={!result} onClick={() => onDraft(result)}>存为草稿 / 排期</button>
            <button type="button" className={s.btn} disabled={!result} onClick={() => onPoster({ text: result })}>做海报</button>
          </div>
        </div>
      </div>
      {note && <p role="status" className={s.error}>{note}</p>}
    </section>
  )
}
