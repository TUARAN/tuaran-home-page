'use client'

import { useEffect, useState } from 'react'

import { call, compact, message, post } from './api'
import { buildBoardSvg } from '../../../lib/x/workbench/posterCore'
import s from './workbench.module.css'

const WINDOWS = [['today', '今日榜'], ['yesterday', '昨日榜'], ['7d', '7 天榜']]
const DIMS = [['posts', '发帖', '帖'], ['replies', '评论', '条'], ['views', '曝光', ''], ['likes', '获赞', '赞']]

export default function BoardTab() {
  const [win, setWin] = useState('today')
  const [dim, setDim] = useState('views')
  const [rows, setRows] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  useEffect(() => { call('/topics?review=1').then(res => { if (res.ok) setSuggestions(res.data.suggestions) }) }, [])
  async function review(id, decision) {
    const res = await post('/topics', { action: 'review', id, decision })
    if (res.ok) setSuggestions(items => items.filter(i => i.id !== id))
    else setNote(message(res.data))
  }
  const [days, setDays] = useState([])
  const [from, setFrom] = useState(0)
  const [note, setNote] = useState('')

  useEffect(() => {
    let live = true
    call(`/leaderboard?window=${win}&dim=${dim}`).then((res) => {
      if (!live) return
      if (res.ok) { setRows(res.data.rows); setFrom(res.data.from); setNote('') } else setNote(message(res.data))
    })
    call(`/leaderboard?history=1&dim=${dim}`).then(res => { if (live) setDays(res.ok ? res.data.days : []) })
    return () => { live = false }
  }, [win, dim])

  function shareBoard() {
    const svg = buildBoardSvg({ rows, title: WINDOWS.find(w => w[0] === win)[1], metric: dim, label: DIMS.find(d => d[0] === dim)[1], date: new Date(from).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) })
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * 2; canvas.height = img.height * 2
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (!blob) { setNote('图片生成失败'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `x-board-${win}-${dim}.png`; a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }, 'image/png')
    }
    img.onerror = () => setNote('图片生成失败')
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  const unit = DIMS.find((d) => d[0] === dim)
  const top = rows[0]
  return (
    <section>
      <h2 className={s.h2}>账号榜</h2>
      <p className={s.hint}>统计日以北京时间每天 8 点为界。榜单只覆盖工作台采集到的推文，不代表全站数据；评论数按公开指标汇总，仅供参考。</p>
      <div className={s.row}>
        {WINDOWS.map(([k, label]) => (
          <button key={k} type="button" className={`${s.btn} ${win === k ? s.primary : ''}`} onClick={() => setWin(k)}>{label}</button>
        ))}
        <span className={s.note}>|</span>
        {DIMS.map(([k, label]) => (
          <button key={k} type="button" className={`${s.btn} ${dim === k ? s.primary : ''}`} onClick={() => setDim(k)}>{label}</button>
        ))}
      </div>
      <button type="button" className={s.btn} disabled={!rows.length} onClick={shareBoard}>下载榜单分享图</button>
      {rows.length === 0 && <div className={s.card}>这个时间段还没有收录数据。</div>}
      {top && (
        <div className={s.champ} style={{ marginBottom: 12 }}>
          <div className={s.champNo}>No.1</div>
          <h3 style={{ margin: '8px 0 2px' }}>{top.display_name || `@${top.handle}`}</h3>
          <a href={`https://x.com/${top.handle}`} target="_blank" rel="noreferrer noopener" className={s.note}>@{top.handle}</a>
          <div className={s.meta} style={{ marginTop: 8 }}>
            <span>发帖 {top.posts}</span><span>评论 {compact(top.replies)}</span><span>曝光 {compact(top.views)}</span><span>获赞 {compact(top.likes)}</span>
          </div>
        </div>
      )}
      {rows.slice(1).map((r) => (
        <div key={r.handle} className={s.rank}>
          <span className={s.rankNo}>{r.rank}</span>
          <a href={`https://x.com/${r.handle}`} target="_blank" rel="noreferrer noopener" style={{ flex: 1, color: 'inherit' }}>
            <strong>{r.display_name || `@${r.handle}`}</strong> <span className={s.note}>@{r.handle}</span>
          </a>
          <strong>{dim === 'posts' ? r.posts : compact(r[dim])}{unit[2]}</strong>
        </div>
      ))}
      <h3>近 7 日冠军</h3>
      <p className={s.hint}>按当前已采集指标重算，每日北京时间 8 点起算，后续采集可能改变排名。</p>
      {days.map(day => <div className={s.rank} key={day.from}><span>{new Date(day.from).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>{day.champion ? <a href={`https://x.com/${day.champion.handle}`} target="_blank" rel="noreferrer noopener">@{day.champion.handle}</a> : <span>尚无数据</span>}</div>)}
      {suggestions && <section><h3>话题审核（站长）</h3>{suggestions.length === 0 && <p>暂无待审核话题。</p>}{suggestions.map(item => <div className={s.rank} key={item.id}><a href={`https://x.com/i/status/${item.tweet_id}`} target="_blank" rel="noreferrer noopener">查看推文</a><span>{item.topic}</span><button type="button" className={s.btn} onClick={() => review(item.id, 'approved')}>通过</button><button type="button" className={s.btn} onClick={() => review(item.id, 'rejected')}>拒绝</button></div>)}</section>}
      {note && <p role="status" className={s.error}>{note}</p>}
    </section>
  )
}
