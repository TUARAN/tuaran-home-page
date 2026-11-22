'use client'

import { useCallback, useEffect, useState } from 'react'

import { parseTweetUrl } from '../../../lib/x/workbench/radarCore'
import { ago, call, compact, message, post } from './api'
import s from './workbench.module.css'

const HOURS = [[3, '3小时内'], [6, '6小时内'], [12, '12小时内'], [24, '24小时']]
const MEDIA = [['', '全部'], ['none', '文字'], ['image', '图文'], ['video', '视频']]
const COLORS = ['#2f6bff', '#7a5cff', '#23b0d6', '#f08a24', '#e5484d', '#30a46c', '#8e4ec6', '#d6409f']

export function Avatar({ handle, name, small }) {
  const text = String(name || handle || '?').trim()
  const color = COLORS[[...String(handle)].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length]
  return <span className={`${s.avatar} ${small ? s.avatarSm : ''}`} style={{ background: color }} aria-hidden="true">{Array.from(text)[0]?.toUpperCase()}</span>
}

function perHour(i) {
  return i.views / Math.max(1, (Date.now() - i.tweetAt) / 3_600_000)
}

function Pills({ label, value, options, onChange }) {
  return (
    <div className={s.filterLine}>
      <span className={s.filterLabel}>{label}</span>
      {options.map(([k, text]) => (
        <button key={String(k)} type="button" className={`${s.pill} ${value === k ? s.pillOn : ''}`} onClick={() => onChange(k)}>{text}</button>
      ))}
    </div>
  )
}

function Panel({ title, sort, metric, keyword, watchOnly, reload, acts, signedIn }) {
  const [topic, setTopic] = useState('')
  const [topics, setTopics] = useState([])
  const [tagNote, setTagNote] = useState('')
  const [problem, setProblem] = useState('')
  useEffect(() => { call('/topics').then(res => { if (res.ok) setTopics(res.data.topics || []) }) }, [])
  async function tag(tweetId) {
    const chosen = window.prompt('选择或填写话题，提交后由站长审核：' + topics.join('、'))
    if (!chosen?.trim()) return
    const res = await post('/topics', { tweetId, topic: chosen })
    setTagNote(res.ok ? '话题已提交，审核后进入公开分类。' : message(res.data))
  }
  const [hours, setHours] = useState(24)
  const [media, setMedia] = useState('')
  const [items, setItems] = useState(null)

  useEffect(() => {
    let live = true
    const q = new URLSearchParams({ sort, hours: String(hours), media, limit: '20', topic, q: keyword, watch: watchOnly ? '1' : '0' })
    call(`/radar?${q}`).then((res) => {
      if (!live) return
      if (res.ok) { setItems(res.data.items || []); setProblem('') }
      else { setItems([]); setProblem(res.status === 401 ? '' : '推文榜暂时不可用，请稍后再试。') }
    })
    return () => { live = false }
  }, [sort, hours, media, keyword, watchOnly, reload, topic])

  const list = items || []
  const shown = sort === 'score' ? [...list].sort((a, b) => perHour(b) - perHour(a)) : list
  return (
    <section className={s.panel}>
      <div className={s.panelHead}><h2>{title}</h2><span>近 {hours} 小时发布 · {list.length} 条</span></div>
      <label className={s.filterLine}>话题 <select className={s.input} value={topic} onChange={e => setTopic(e.target.value)}><option value="">全部</option>{topics.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      {tagNote && <p role="status" className={s.note}>{tagNote}</p>}
      <Pills label="形式" value={media} options={MEDIA} onChange={setMedia} />
      <Pills label="时间" value={hours} options={HOURS} onChange={setHours} />
      {problem && <div className={s.empty}>{problem}</div>}
      {items && !problem && list.length === 0 && <div className={s.empty}>这个时间段还没有收录。</div>}
      {shown.map((i, n) => (
        <article key={i.id} className={s.item}>
          {signedIn && <button type="button" className={s.btn} onClick={() => tag(i.id)}>标注话题</button>}
          <span className={`${s.no} ${n < 3 ? s[`no${n + 1}`] : ''}`}>{n + 1}</span>
          <div className={s.itemBody}>
            <p className={s.itemText}>{i.text || '（无文字）'}</p>
            <div className={s.itemMeta}>
              <Avatar handle={i.handle} name={i.displayName} small />
              <b>{i.displayName || `@${i.handle}`}</b><span>· {compact(i.likes)} 赞 · {ago(i.tweetAt)}</span>
              {i.note && <span className={s.chip}>{i.note}</span>}
            </div>
            <div className={s.itemActs}>{acts(i)}</div>
          </div>
          <div className={s.metric}>{metric(i)}</div>
        </article>
      ))}
    </section>
  )
}

export default function RadarTab({ keyword, onKeyword, onPoster, signedIn = false }) {
  const [heroState, setHeroState] = useState('loading')
  const [heroRows, setHeroRows] = useState([])
  const [watch, setWatch] = useState([])
  const [watchOnly, setWatchOnly] = useState(false)
  const [reload, setReload] = useState(0)
  const [note, setNote] = useState('')
  const [manual, setManual] = useState({ url: '', text: '', likes: '', views: '', media: 'none' })

  const loadSide = useCallback(async () => {
    const [h, w] = await Promise.all([call('/leaderboard?window=today&dim=posts'), call('/radar?limit=1&hours=1')])
    if (h.ok) { setHeroRows((h.data.rows || []).slice(0, 10)); setHeroState('ok') }
    else setHeroState(h.status === 503 || h.status === 0 ? 'down' : 'empty')
    if (w.ok) setWatch(w.data.watch || [])
  }, [])

  useEffect(() => { loadSide() }, [loadSide, reload])

  async function addWatch(handle) {
    const remark = window.prompt(`给 @${handle} 加个备注（可留空）`, '') ?? ''
    const res = await post('/radar', { action: 'watch', handle, note: remark })
    setNote(res.ok ? `已监控 @${handle}` : message(res.data))
    setReload((n) => n + 1)
  }

  async function submitManual(event) {
    event.preventDefault()
    const t = parseTweetUrl(manual.url)
    if (!t) return setNote('请填入形如 https://x.com/用户名/status/数字 的推文链接')
    const res = await post('/radar', { action: 'ingest', items: [{ ...t, text: manual.text, likes: manual.likes, views: manual.views, media: manual.media }] })
    setNote(res.ok && res.data.accepted ? '已收录' : '没有收录，请检查链接（只收最近 30 天内的推文）')
    if (res.ok) { setManual({ url: '', text: '', likes: '', views: '', media: 'none' }); setReload((n) => n + 1) }
  }

  const acts = (i) => (
    <>
      {signedIn && onPoster && <button type="button" className={s.link} onClick={() => onPoster(i)}>做海报</button>}
      {signedIn && !i.watched && <button type="button" className={s.link} onClick={() => addWatch(i.handle)}>+ 监控</button>}
      <a className={s.link} href={i.url} target="_blank" rel="noreferrer noopener">原帖</a>
    </>
  )
  const empty = heroState !== 'down' && heroRows.length === 0
  return (
    <section>
      <div className={s.pageTitle}><h1>推文榜</h1><span className={s.note}>爆发指数 = 加权互动量 ÷ 发布时长；统计日以北京时间 8 点为界</span></div>
      <div className={s.hero}>
        <div className={s.heroTitle}>热门贡献榜</div>
        {heroState === 'down' && <div className={s.empty} style={{ flex: 1, padding: 14 }}>推文榜暂时不可用，请稍后再试。</div>}
        {empty && <div className={s.empty} style={{ flex: 1, padding: 14 }}>今天还没有收录。</div>}
        {heroRows.map((r, n) => (
          <a key={r.handle} className={`${s.heroCard} ${n < 3 ? `${s.heroTop} ${s[`top${n + 1}`]}` : ''}`} href={`https://x.com/${r.handle}`} target="_blank" rel="noreferrer noopener">
            {n < 3 ? <span className={s.heroTag}>TOP {n + 1}</span> : <div className={s.heroNo}>{n + 1}</div>}
            {n < 3 ? (
              <div className={s.heroBody}><Avatar handle={r.handle} name={r.display_name} /><div style={{ minWidth: 0 }}>
                <div className={s.heroCount}>{r.posts}<small> 条</small></div><div className={s.heroName}>{r.display_name || `@${r.handle}`}</div></div></div>
            ) : (
              <><Avatar handle={r.handle} name={r.display_name} /><div className={s.heroName}>{r.display_name || `@${r.handle}`}</div>
                <div className={s.heroCount}>{r.posts}<small> 条</small></div></>
            )}
          </a>
        ))}
      </div>

      <div className={s.row}>
        {signedIn && <label><input type="checkbox" checked={watchOnly} onChange={(e) => setWatchOnly(e.target.checked)} /> 只看监控账号</label>}
        {keyword && <button type="button" className={s.pill} onClick={() => onKeyword('')}>搜索：{keyword} ×</button>}
        {watch.map((w) => <span key={w.handle} className={s.chip}>@{w.handle}{w.note ? `（${w.note}）` : ''}</span>)}
      </div>

      <div className={s.cols}>
        <Panel title="增速最快" sort="score" metric={(i) => <>{compact(Math.round(perHour(i)))}<small> 曝光/时</small></>} keyword={keyword} watchOnly={watchOnly} reload={reload} acts={acts} signedIn={signedIn} />
        <Panel title="曝光最高" sort="views" metric={(i) => <>{compact(i.views)}<small> 曝光</small></>} keyword={keyword} watchOnly={watchOnly} reload={reload} acts={acts} signedIn={signedIn} />
      </div>

      {signedIn && empty && (
        <div className={s.card} style={{ marginTop: 18 }}>
          <strong>榜单还是空的，三种方式让它有数据</strong>
          <div className={s.steps}>
            <div className={s.step}><b>1 装插件</b>浏览 X 时，插件把你看到的公开推文提交到这里（采集接入还在做）。</div>
            <div className={s.step}><b>2 手动收录</b>在下方粘贴推文链接和数据，立刻上榜。</div>
            <div className={s.step}><b>3 监控账号</b>榜单里点「+ 监控」，只看你关心的人。</div>
          </div>
        </div>
      )}
      {signedIn && (
        <details className={s.card} style={{ marginTop: 18 }} open={empty}>
          <summary>手动收录一条推文</summary>
          <form onSubmit={submitManual} style={{ marginTop: 12 }}>
            <div className={s.row}>
              <input className={s.input} style={{ flex: 1 }} placeholder="推文链接 https://x.com/…/status/…" value={manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} />
            </div>
            <textarea className={`${s.input} ${s.area}`} style={{ minHeight: 80 }} placeholder="正文" value={manual.text} onChange={(e) => setManual({ ...manual, text: e.target.value })} />
            <div className={s.row} style={{ marginTop: 8 }}>
              <input className={s.input} style={{ width: 110 }} inputMode="numeric" placeholder="点赞数" value={manual.likes} onChange={(e) => setManual({ ...manual, likes: e.target.value })} />
              <input className={s.input} style={{ width: 110 }} inputMode="numeric" placeholder="展示量" value={manual.views} onChange={(e) => setManual({ ...manual, views: e.target.value })} />
              <select className={s.input} value={manual.media} onChange={(e) => setManual({ ...manual, media: e.target.value })}>
                <option value="none">纯文本</option><option value="image">图文</option><option value="video">视频</option>
              </select>
              <button type="submit" className={`${s.btn} ${s.primary}`}>收录</button>
            </div>
          </form>
        </details>
      )}
      {note && <p role="status" className={s.note}>{note}</p>}
    </section>
  )
}
