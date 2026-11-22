'use client'

import { useEffect, useMemo, useState } from 'react'

import { buildPosterSvg } from '../../../lib/x/workbench/posterCore'
import s from './workbench.module.css'

export default function PosterTab({ seed, handle }) {
  const [form, setForm] = useState({ name: '', handle: handle || '', text: '', theme: 'light' })

  useEffect(() => {
    if (seed) setForm((f) => ({ ...f, name: seed.displayName || f.name, handle: seed.handle || f.handle, text: seed.text || f.text }))
  }, [seed])

  const svg = useMemo(() => buildPosterSvg({ ...form, date: new Date().toISOString().slice(0, 10) }), [form])
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  function toPng(download) {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(async (blob) => {
        if (!blob) return
        if (download) {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `poster-${Date.now()}.png`
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        } else if (navigator.clipboard?.write && window.ClipboardItem) {
          await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
        }
      }, 'image/png')
    }
    img.src = src
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <section>
      <h2 className={s.h2}>海报</h2>
      <p className={s.hint}>把一段文字做成带作者名的图片，在浏览器里本地生成，不上传。</p>
      <div className={s.two}>
        <div>
          <div className={s.row}>
            <input className={s.input} placeholder="昵称" value={form.name} onChange={set('name')} />
            <input className={s.input} placeholder="X 账号（不带 @）" value={form.handle} onChange={set('handle')} />
            <select className={s.input} value={form.theme} onChange={set('theme')} aria-label="主题">
              <option value="light">浅色</option><option value="dark">深色</option><option value="blue">品牌蓝</option>
            </select>
          </div>
          <textarea className={`${s.input} ${s.area}`} placeholder="海报正文" maxLength={600} value={form.text} onChange={set('text')} />
          <div className={s.row} style={{ marginTop: 8 }}>
            <button type="button" className={`${s.btn} ${s.primary}`} disabled={!form.text} onClick={() => toPng(true)}>下载 PNG</button>
            <button type="button" className={s.btn} disabled={!form.text} onClick={() => toPng(false)}>复制图片</button>
          </div>
        </div>
        <img className={s.preview} src={src} alt="海报预览" />
      </div>
    </section>
  )
}
