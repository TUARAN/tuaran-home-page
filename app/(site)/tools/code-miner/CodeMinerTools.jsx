'use client'

/* eslint-disable @next/next/no-img-element -- previews use remote GIF URLs, blob URLs, and generated data URLs */

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  IconArrowsExchange,
  IconBraces,
  IconCheck,
  IconCopy,
  IconDownload,
  IconPhoto,
  IconQrcode,
  IconSearch,
  IconSparkles,
  IconUpload,
} from '@tabler/icons-react'

import {
  CODE_MINER_TOOLS,
  decodeBase64Text,
  encodeBase64Text,
  formatJson,
  getJsonDepth,
  normalizeCodeMinerTool,
} from '../../../../lib/codeMinerTools.mjs'

const panelClass = 'rounded-xl border border-[#d9d3c7] bg-white/75 p-4 shadow-sm dark:border-[#29323d] dark:bg-[#111820]/90 sm:p-5'
const inputClass = 'w-full rounded-lg border border-[#d6d0c4] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#8a6422] focus:ring-2 focus:ring-amber-100 dark:border-[#34404d] dark:bg-[#0d141c] dark:focus:ring-amber-950'
const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8a6422] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#6f5019] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d4ae66] dark:text-[#17130d]'
const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d6d0c4] bg-white/80 px-3 py-2 text-sm font-semibold transition hover:border-[#8a6422] dark:border-[#34404d] dark:bg-[#121b25]'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function copyText(value, setNotice) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    setNotice('已复制')
  } catch {
    setNotice('复制失败，请手动选择文本')
  }
}

function ToolHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-5 border-b border-[#e1dbcf] pb-4 dark:border-[#29323d]">
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a742f] dark:text-[#d4ae66]">{eyebrow}</p>
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#706b61] dark:text-[#9da7b5]">{description}</p>
    </div>
  )
}

function GifTool() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function search(event) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setStatus('')
    try {
      const response = await fetch(`/api/tools/gifs?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '搜索失败')
      setItems(data.results || [])
      setStatus(data.results?.length ? `找到 ${data.results.length} 个结果` : '没有找到结果')
    } catch (error) {
      setItems([])
      setStatus(error.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  async function downloadGif(item) {
    setStatus(`正在下载 ${item.title || 'GIF'}…`)
    try {
      const response = await fetch(item.url)
      if (!response.ok) throw new Error('下载失败')
      downloadBlob(await response.blob(), `${item.id || 'tenor'}.gif`)
      setStatus('下载已开始')
    } catch {
      window.open(item.url, '_blank', 'noopener,noreferrer')
      setStatus('已在新窗口打开原图，可使用浏览器保存')
    }
  }

  return (
    <div>
      <ToolHeading eyebrow="Search & Download" title="GIF 搜索下载" description="通过 Tenor 搜索 GIF，查看尺寸和文件大小并下载原图。" />
      <form onSubmit={search} className="flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} placeholder="输入关键词，例如 happy、猫、鼓掌" />
        <button type="submit" disabled={loading || !query.trim()} className={primaryButton}><IconSearch size={18} />{loading ? '搜索中' : '搜索'}</button>
      </form>
      {status ? <p className="mt-3 text-xs text-[#777166] dark:text-[#9da7b5]">{status}</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-[#ddd7cb] bg-[#f7f4ed] dark:border-[#303a46] dark:bg-[#0d141c]">
            <img src={item.preview || item.url} alt={item.title || query} className="aspect-[4/3] w-full bg-[#ece8de] object-cover dark:bg-[#18212b]" loading="lazy" />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2"><strong className="line-clamp-1 text-sm">{item.title || 'GIF'}</strong><span className="shrink-0 text-[10px] text-[#888176]">{item.dimensions}</span></div>
              <button type="button" onClick={() => downloadGif(item)} className={`${secondaryButton} mt-3 w-full`}><IconDownload size={16} />下载 {item.size}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function ImageTool() {
  const fileRef = useRef(null)
  const sourceUrlRef = useRef('')
  const resultUrlRef = useRef('')
  const [source, setSource] = useState(null)
  const [result, setResult] = useState(null)
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(1920)
  const [format, setFormat] = useState('webp')
  const [notice, setNotice] = useState('')

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  function selectFile(event) {
    const file = event.target.files?.[0]
    if (!file?.type.startsWith('image/')) return
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    sourceUrlRef.current = URL.createObjectURL(file)
    resultUrlRef.current = ''
    setSource({ file, url: sourceUrlRef.current })
    setResult(null)
    setNotice('图片已载入，调整参数后开始压缩')
  }

  async function compress() {
    if (!source) return
    setNotice('正在压缩…')
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) return setNotice('当前浏览器无法生成该格式')
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = URL.createObjectURL(blob)
        setResult({ blob, url: resultUrlRef.current, width: canvas.width, height: canvas.height })
        setNotice(`压缩完成，体积减少 ${Math.max(0, Math.round((1 - blob.size / source.file.size) * 100))}%`)
      }, `image/${format}`, quality / 100)
    }
    image.onerror = () => setNotice('图片读取失败')
    image.src = source.url
  }

  return (
    <div>
      <ToolHeading eyebrow="Local Image" title="图片压缩" description="图片只在当前浏览器内处理，可调整质量、最大宽度与输出格式。" />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={selectFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className={`${secondaryButton} w-full`}><IconUpload size={18} />选择图片</button>
          <label className="block text-xs font-semibold">质量：{quality}%<input type="range" min="20" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-2 w-full accent-[#8a6422]" /></label>
          <label className="block text-xs font-semibold">最大宽度<input type="number" min="128" max="8000" value={maxWidth} onChange={(event) => setMaxWidth(Number(event.target.value) || 1920)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">输出格式<select value={format} onChange={(event) => setFormat(event.target.value)} className={`${inputClass} mt-2`}><option value="webp">WebP</option><option value="jpeg">JPEG</option><option value="png">PNG</option></select></label>
          <button type="button" onClick={compress} disabled={!source} className={`${primaryButton} w-full`}><IconSparkles size={18} />开始压缩</button>
          {notice ? <p className="text-xs leading-5 text-[#777166] dark:text-[#9da7b5]">{notice}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImagePreview title="原图" src={source?.url} meta={source ? `${(source.file.size / 1024).toFixed(1)} KB` : ''} />
          <ImagePreview title="压缩结果" src={result?.url} meta={result ? `${(result.blob.size / 1024).toFixed(1)} KB · ${result.width}×${result.height}` : ''}>
            {result ? <button type="button" onClick={() => downloadBlob(result.blob, `compressed.${format === 'jpeg' ? 'jpg' : format}`)} className={`${secondaryButton} mt-3 w-full`}><IconDownload size={16} />下载</button> : null}
          </ImagePreview>
        </div>
      </div>
    </div>
  )
}

function ImagePreview({ title, src, meta, children }) {
  return <div className="rounded-lg border border-[#ddd7cb] bg-[#f7f4ed] p-3 dark:border-[#303a46] dark:bg-[#0d141c]"><div className="mb-2 flex justify-between gap-2 text-xs"><strong>{title}</strong><span className="text-[#888176]">{meta}</span></div>{src ? <img src={src} alt={title} className="aspect-square w-full rounded-md bg-white object-contain" /> : <div className="flex aspect-square items-center justify-center rounded-md bg-white/70 text-[#aaa398] dark:bg-[#141d27]"><IconPhoto size={42} /></div>}{children}</div>
}

function QrTool() {
  const [text, setText] = useState('https://2aran.com')
  const [size, setSize] = useState(256)
  const [level, setLevel] = useState('M')
  const [color, setColor] = useState('#171611')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!text.trim()) { setUrl(''); return undefined }
    QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: level, color: { dark: color, light: '#ffffff' } })
      .then((value) => { if (!cancelled) { setUrl(value); setError('') } })
      .catch((reason) => { if (!cancelled) setError(reason.message || '二维码生成失败') })
    return () => { cancelled = true }
  }, [color, level, size, text])

  return (
    <div>
      <ToolHeading eyebrow="Generate" title="二维码生成" description="输入文本或链接，调整尺寸、容错级别与颜色，下载 PNG。" />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} className={inputClass} placeholder="输入文本、链接、电话或邮箱" />
          <label className="block text-xs font-semibold">尺寸：{size}px<input type="range" min="128" max="512" step="32" value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-2 w-full accent-[#8a6422]" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">容错级别<select value={level} onChange={(event) => setLevel(event.target.value)} className={`${inputClass} mt-2`}><option value="L">低（7%）</option><option value="M">中（15%）</option><option value="Q">高（25%）</option><option value="H">最高（30%）</option></select></label><label className="text-xs font-semibold">前景色<input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#d6d0c4] bg-white p-1" /></label></div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#ddd7cb] bg-[#f7f4ed] p-5 dark:border-[#303a46] dark:bg-[#0d141c]">
          {url ? <img src={url} alt="生成的二维码" width={size} height={size} className="max-w-full rounded-md bg-white" /> : <IconQrcode size={80} className="text-[#aaa398]" />}
          <button type="button" disabled={!url} onClick={() => { const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'qrcode.png'; anchor.click() }} className={`${primaryButton} mt-4 w-full`}><IconDownload size={17} />下载二维码</button>
        </div>
      </div>
    </div>
  )
}

function JsonTool() {
  const [input, setInput] = useState('{\n  "site": "2aran.com",\n  "tools": 6\n}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const stats = useMemo(() => {
    if (!output || error) return null
    const parsed = JSON.parse(output)
    return { characters: output.length, lines: output.split('\n').length, depth: getJsonDepth(parsed), bytes: new Blob([output]).size }
  }, [error, output])

  function transform(compact) {
    try { setOutput(formatJson(input, compact)); setError(''); setNotice(compact ? '已压缩' : '已格式化') }
    catch (reason) { setOutput(''); setError(`JSON 语法错误：${reason.message}`) }
  }

  return (
    <div>
      <ToolHeading eyebrow="Developer" title="JSON 格式化" description="校验、格式化或压缩 JSON，并统计字符、行数、深度与字节数。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div><div className="mb-2 flex flex-wrap gap-2"><button type="button" onClick={() => transform(false)} className={primaryButton}>格式化</button><button type="button" onClick={() => transform(true)} className={secondaryButton}>压缩</button><button type="button" onClick={() => { setInput(''); setOutput(''); setError('') }} className={secondaryButton}>清空</button></div><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} spellCheck={false} className={`${inputClass} font-mono leading-6`} />{error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}</div>
        <div><div className="mb-2 flex flex-wrap gap-2"><button type="button" onClick={() => copyText(output, setNotice)} className={secondaryButton}><IconCopy size={16} />复制</button><button type="button" disabled={!output} onClick={() => downloadBlob(new Blob([output], { type: 'application/json' }), 'formatted.json')} className={secondaryButton}><IconDownload size={16} />下载</button>{notice ? <span className="self-center text-xs text-emerald-700 dark:text-emerald-400">{notice}</span> : null}</div><pre className="min-h-[456px] max-h-[560px] overflow-auto rounded-lg bg-[#17191e] p-4 text-xs leading-6 text-[#d8e1ec]"><code>{output || '格式化结果显示在这里'}</code></pre></div>
      </div>
      {stats ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries({ 字符数: stats.characters, 行数: stats.lines, 最大深度: stats.depth, 字节数: stats.bytes }).map(([label, value]) => <div key={label} className="rounded-lg bg-[#f2eee5] p-3 text-center dark:bg-[#19222c]"><strong className="block text-lg">{value}</strong><span className="text-[11px] text-[#817a6e]">{label}</span></div>)}</div> : null}
    </div>
  )
}

function Base64Tool() {
  const fileRef = useRef(null)
  const [encodeInput, setEncodeInput] = useState('')
  const [encoded, setEncoded] = useState('')
  const [decodeInput, setDecodeInput] = useState('')
  const [decoded, setDecoded] = useState('')
  const [imageData, setImageData] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function encode() { try { setEncoded(encodeBase64Text(encodeInput)); setError('') } catch (reason) { setError(reason.message) } }
  function decode() { try { setDecoded(decodeBase64Text(decodeInput)); setError('') } catch { setDecoded(''); setError('Base64 内容无效，或解码结果不是 UTF-8 文本') } }
  function readImage(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImageData(String(reader.result || '')); reader.readAsDataURL(file) }

  return (
    <div>
      <ToolHeading eyebrow="Encode & Decode" title="Base64 编解码" description="支持 UTF-8 文本双向转换，也可把图片转为 Data URL 或预览图片 Base64。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={panelClass}><h3 className="mb-3 font-bold">文本 → Base64</h3><textarea value={encodeInput} onChange={(event) => setEncodeInput(event.target.value)} rows={5} className={inputClass} placeholder="输入任意文本" /><div className="my-2 flex gap-2"><button type="button" onClick={encode} className={primaryButton}>编码</button><button type="button" onClick={() => copyText(encoded, setNotice)} className={secondaryButton}><IconCopy size={16} />复制</button></div><textarea readOnly value={encoded} rows={6} className={`${inputClass} font-mono text-xs`} placeholder="Base64 结果" /></div>
        <div className={panelClass}><h3 className="mb-3 font-bold">Base64 → 文本</h3><textarea value={decodeInput} onChange={(event) => setDecodeInput(event.target.value)} rows={5} className={`${inputClass} font-mono text-xs`} placeholder="输入 Base64" /><div className="my-2 flex gap-2"><button type="button" onClick={decode} className={primaryButton}>解码</button><button type="button" onClick={() => copyText(decoded, setNotice)} className={secondaryButton}><IconCopy size={16} />复制</button></div><textarea readOnly value={decoded} rows={6} className={inputClass} placeholder="解码结果" /></div>
      </div>
      <div className={`${panelClass} mt-4`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">图片与 Base64</h3><p className="mt-1 text-xs text-[#777166]">选择图片后在本地生成 Data URL；也可以粘贴 Data URL 直接预览。</p></div><><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={readImage} /><button type="button" onClick={() => fileRef.current?.click()} className={secondaryButton}><IconUpload size={16} />选择图片</button></></div><textarea value={imageData} onChange={(event) => setImageData(event.target.value)} rows={5} className={`${inputClass} mt-4 font-mono text-xs`} placeholder="data:image/png;base64,..." />{imageData.startsWith('data:image/') ? <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]"><img src={imageData} alt="Base64 图片预览" className="max-h-52 w-full rounded-lg bg-white object-contain" /><div className="space-y-2"><button type="button" onClick={() => copyText(imageData, setNotice)} className={`${secondaryButton} w-full`}><IconCopy size={16} />复制 Data URL</button><button type="button" onClick={() => { const anchor = document.createElement('a'); anchor.href = imageData; anchor.download = 'decoded-image'; anchor.click() }} className={`${secondaryButton} w-full`}><IconDownload size={16} />下载图片</button></div></div> : null}</div>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}{notice ? <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{notice}</p> : null}
    </div>
  )
}

function DiceTool() {
  const [optionA, setOptionA] = useState('是')
  const [optionB, setOptionB] = useState('否')
  const [method, setMethod] = useState('crypto')
  const [result, setResult] = useState('')
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState([])

  function roll() {
    setRolling(true)
    window.setTimeout(() => {
      const random = method === 'crypto' ? crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random()
      const choice = random < 0.5 ? (optionA.trim() || '选项 A') : (optionB.trim() || '选项 B')
      setResult(choice)
      setHistory((items) => [{ id: `${Date.now()}-${random}`, choice, random, method }, ...items].slice(0, 5))
      setRolling(false)
    }, 520)
  }

  return (
    <div>
      <ToolHeading eyebrow="Random Choice" title="摇色子决定器" description="在两个选项中随机选择一个，并保留当前页面最近 5 次结果。" />
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">选项 A<input value={optionA} onChange={(event) => setOptionA(event.target.value)} className={`${inputClass} mt-2`} /></label><label className="text-xs font-semibold">选项 B<input value={optionB} onChange={(event) => setOptionB(event.target.value)} className={`${inputClass} mt-2`} /></label></div>
        <div className="grid grid-cols-2 gap-2">{[{ id: 'crypto', title: 'Crypto API', desc: '密码学安全随机数' }, { id: 'math', title: 'Math.random()', desc: '日常伪随机数' }].map((item) => <button key={item.id} type="button" onClick={() => setMethod(item.id)} className={`rounded-lg border p-3 text-left ${method === item.id ? 'border-[#8a6422] bg-amber-50 dark:bg-amber-950/20' : 'border-[#d6d0c4] dark:border-[#34404d]'}`}><strong className="block text-sm">{item.title}</strong><span className="text-[11px] text-[#817a6e]">{item.desc}</span></button>)}</div>
        <div className="rounded-xl bg-gradient-to-br from-[#29251d] to-[#8a6422] p-6 text-center text-white dark:from-[#17191e] dark:to-[#5c4721]"><div className={`text-7xl ${rolling ? 'animate-bounce' : ''}`}>🎲</div><button type="button" onClick={roll} disabled={rolling} className="mt-4 rounded-lg bg-white px-7 py-3 text-sm font-bold text-[#5e4518] disabled:opacity-70">{rolling ? '摇动中…' : '摇色子'}</button>{result ? <div className="mt-5 border-t border-white/20 pt-4"><span className="text-xs text-white/70">选择结果</span><strong className="mt-1 block text-3xl">{result}</strong></div> : null}</div>
        {history.length ? <ol className="divide-y divide-[#e1dbcf] rounded-lg border border-[#ddd7cb] px-4 text-sm dark:divide-[#303a46] dark:border-[#303a46]">{history.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2"><IconCheck size={16} className="text-emerald-600" />{item.choice}</span><code className="text-[10px] text-[#8b8478]">{item.method} · {item.random.toFixed(6)}</code></li>)}</ol> : null}
      </div>
    </div>
  )
}

const PANELS = { gif: GifTool, image: ImageTool, qr: QrTool, json: JsonTool, base64: Base64Tool, dice: DiceTool }
const TOOL_ICONS = { gif: IconSearch, image: IconPhoto, qr: IconQrcode, json: IconBraces, base64: IconArrowsExchange, dice: IconSparkles }

export default function CodeMinerTools() {
  const [active, setActive] = useState('gif')
  useEffect(() => {
    const sync = () => setActive(normalizeCodeMinerTool(window.location.hash.slice(1)))
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const ActivePanel = PANELS[active]

  function selectTool(id) {
    setActive(id)
    window.history.replaceState(null, '', `${window.location.pathname}#${id}`)
  }

  return (
    <main className="min-h-screen bg-[#f1eee7] px-4 py-8 text-[#171611] dark:bg-[#0c1015] dark:text-gray-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 border-b border-[#d7d0c3] pb-5 dark:border-[#29323d]">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a8174]"><Link href="/tools" className="hover:text-[#8a6422]">工具库</Link><span>／</span><span>代码矿工</span></div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">代码矿工工具集</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#706b61] dark:text-[#9da7b5]">六个旧站工具已经合并到主站。图片、文本和随机选择均在当前浏览器处理；GIF 搜索通过站内接口访问 Tenor。</p>
        </header>
        <nav aria-label="代码矿工工具" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CODE_MINER_TOOLS.map((tool) => { const Icon = TOOL_ICONS[tool.id]; return <button key={tool.id} type="button" onClick={() => selectTool(tool.id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${active === tool.id ? 'border-[#8a6422] bg-[#8a6422] text-white dark:border-[#d4ae66] dark:bg-[#d4ae66] dark:text-[#17130d]' : 'border-[#d7d0c3] bg-white/70 hover:border-[#8a6422] dark:border-[#303a46] dark:bg-[#121922]'}`}><Icon size={17} />{tool.shortTitle}</button> })}
        </nav>
        <section className={panelClass}><ActivePanel /></section>
        <p className="mt-4 text-center text-[11px] text-[#8b8478]">源项目：<a href="https://github.com/TUARAN/toolkit-hub" target="_blank" rel="noreferrer" className="underline underline-offset-4">TUARAN/toolkit-hub</a></p>
      </div>
    </main>
  )
}
