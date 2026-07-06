'use client'

import { useMemo, useRef, useState } from 'react'
import {
  IconCopy,
  IconDownload,
  IconFileTypeHtml,
  IconPrinter,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react'

const SAMPLE_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>HTML 转 PDF 示例</title>
  <style>
    @page { size: A4; margin: 25mm 22mm; }
    body { font-family: 仿宋_GB2312, 仿宋, serif; font-size: 16pt; line-height: 1.8; color: #222; }
    h1, h2 { font-family: 黑体, sans-serif; font-size: 16pt; }
  </style>
</head>
<body>
  <h1>一、背景</h1>
  <p>上传 HTML 后，点击打印即可在浏览器里保存为 PDF。</p>
</body>
</html>`

const PAPER_SIZE = {
  a4: 'A4',
  letter: 'Letter',
}

function stripUnsafeMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '')
}

function buildInjectedStyle({ paper, scale, preserveColors, fontAlias }) {
  const printColor = preserveColors ? 'exact' : 'economy'
  const fonts = fontAlias
    ? `
@font-face { font-family: '仿宋_GB2312'; src: local('STFangsong'), local('FangSong'), local('FangSong_GB2312'), local('仿宋_GB2312'), local('仿宋'); }
@font-face { font-family: '仿宋'; src: local('STFangsong'), local('FangSong'), local('FangSong_GB2312'), local('仿宋_GB2312'), local('仿宋'); }
@font-face { font-family: '黑体'; src: local('STHeiti'), local('SimHei'), local('Heiti SC'), local('黑体'); }
@font-face { font-family: '宋体'; src: local('SimSun'), local('Songti SC'), local('STSong'), local('宋体'); }
@font-face { font-family: '方正小标宋'; src: local('FZXiaoBiaoSong-B05'), local('方正小标宋简体'), local('Songti SC'), local('STSong'); }
@font-face { font-family: '方正小标宋简体'; src: local('FZXiaoBiaoSong-B05'), local('方正小标宋简体'), local('Songti SC'), local('STSong'); }
`
    : ''

  return `<style id="html-to-pdf-tool-style">
${fonts}
html, body {
  -webkit-print-color-adjust: ${printColor};
  print-color-adjust: ${printColor};
}
@page {
  size: ${PAPER_SIZE[paper] || 'A4'};
}
@media print {
  body {
    zoom: ${scale};
  }
}
@media screen {
  body {
    zoom: ${scale};
  }
}
</style>`
}

function normalizeHtml(input, options) {
  const source = options.stripScripts ? stripUnsafeMarkup(input || SAMPLE_HTML) : input || SAMPLE_HTML
  const style = buildInjectedStyle(options)
  const withStyle = /<\/head>/i.test(source)
    ? source.replace(/<\/head>/i, `${style}</head>`)
    : `${style}\n${source}`

  return /^<!doctype/i.test(withStyle) ? withStyle : `<!doctype html>\n${withStyle}`
}

function saveTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function openPrintWindow(html) {
  const printScript = `<script>
window.addEventListener('load', function () {
  window.setTimeout(function () { window.print(); }, 350);
});
</script>`
  const printHtml = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${printScript}</body>`)
    : `${html}\n${printScript}`
  const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const popup = window.open(url, '_blank')
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  return popup
}

export default function HtmlToPdfTool() {
  const fileInputRef = useRef(null)
  const [sourceHtml, setSourceHtml] = useState(SAMPLE_HTML)
  const [fileName, setFileName] = useState('sample.html')
  const [paper, setPaper] = useState('a4')
  const [scale, setScale] = useState(0.82)
  const [preserveColors, setPreserveColors] = useState(true)
  const [fontAlias, setFontAlias] = useState(true)
  const [stripScripts, setStripScripts] = useState(true)
  const [notice, setNotice] = useState('')

  const processedHtml = useMemo(
    () =>
      normalizeHtml(sourceHtml, {
        paper,
        scale,
        preserveColors,
        fontAlias,
        stripScripts,
      }),
    [fontAlias, paper, preserveColors, scale, sourceHtml, stripScripts],
  )

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setSourceHtml(text)
    setFileName(file.name)
    setNotice(`已载入 ${file.name}`)
  }

  function handlePrint() {
    const popup = openPrintWindow(processedHtml)
    if (!popup) {
      setNotice('浏览器拦截了新窗口')
      return
    }
    setNotice('已打开打印版')
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/tools/html-to-pdf`)
    setNotice('已复制工具链接')
  }

  function resetSample() {
    setSourceHtml(SAMPLE_HTML)
    setFileName('sample.html')
    setNotice('已恢复示例')
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-4 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-b border-[#d8d1c4] pb-5 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              Public Tool
            </p>
            <h1 className="mb-3 font-serif text-[36px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[46px]">
              HTML 转 PDF
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              文件在浏览器本地处理，适合把离线 HTML、网页存档和公文页面整理成可打印 PDF。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
            >
              <IconCopy size={17} />
              复制链接
            </button>
            <a
              href="https://github.com/TUARAN/tuaran-home-page"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] no-underline transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#ded8ca] bg-white/68 p-4 dark:border-[#252e38] dark:bg-[#101720]/78">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="mb-0 text-[15px] font-bold">文件</h2>
              <span className="truncate text-[12px] text-[#797469] dark:text-[#9da7b5]">{fileName}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#25221b] px-3 text-[13px] font-semibold text-white transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
              >
                <IconUpload size={17} />
                上传
              </button>
              <button
                type="button"
                onClick={resetSample}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
              >
                <IconRefresh size={17} />
                示例
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#ded8ca] bg-white/68 p-4 dark:border-[#252e38] dark:bg-[#101720]/78">
            <h2 className="mb-3 text-[15px] font-bold">打印</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#68645a] dark:text-[#aab4c2]">纸张</span>
                <select
                  value={paper}
                  onChange={(event) => setPaper(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#d8d1c4] bg-white px-3 text-[14px] dark:border-[#2b3643] dark:bg-[#0e151e]"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 flex justify-between text-[12px] font-semibold text-[#68645a] dark:text-[#aab4c2]">
                  <span>缩放</span>
                  <span>{Math.round(scale * 100)}%</span>
                </span>
                <input
                  type="range"
                  min="0.6"
                  max="1"
                  step="0.01"
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                  className="w-full accent-[#8a6422]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-[13px] text-[#363229] dark:text-[#d7dee9]">
                <span>保留背景</span>
                <input
                  type="checkbox"
                  checked={preserveColors}
                  onChange={(event) => setPreserveColors(event.target.checked)}
                  className="h-4 w-4 accent-[#8a6422]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-[13px] text-[#363229] dark:text-[#d7dee9]">
                <span>中文字体别名</span>
                <input
                  type="checkbox"
                  checked={fontAlias}
                  onChange={(event) => setFontAlias(event.target.checked)}
                  className="h-4 w-4 accent-[#8a6422]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-[13px] text-[#363229] dark:text-[#d7dee9]">
                <span>移除脚本</span>
                <input
                  type="checkbox"
                  checked={stripScripts}
                  onChange={(event) => setStripScripts(event.target.checked)}
                  className="h-4 w-4 accent-[#8a6422]"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#8a6422] px-4 text-[14px] font-bold text-white transition hover:bg-[#6f5019] dark:bg-[#d4ae66] dark:text-[#14100a]"
            >
              <IconPrinter size={18} />
              打开打印版
            </button>
            <button
              type="button"
              onClick={() => saveTextFile(fileName.replace(/\.html?$/i, '') + '.print.html', processedHtml)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
            >
              <IconDownload size={17} />
              下载打印 HTML
            </button>
          </div>
          {notice ? <p className="mb-0 text-[12px] text-[#7a766b] dark:text-[#9da7b5]">{notice}</p> : null}
        </aside>

        <div className="grid min-h-[680px] gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
          <div className="rounded-lg border border-[#ded8ca] bg-white/68 p-3 dark:border-[#252e38] dark:bg-[#101720]/78">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconFileTypeHtml size={18} className="text-[#8a6422] dark:text-[#d4ae66]" />
                <h2 className="mb-0 text-[15px] font-bold">HTML</h2>
              </div>
              <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
                {new Blob([sourceHtml]).size.toLocaleString()} bytes
              </span>
            </div>
            <textarea
              value={sourceHtml}
              onChange={(event) => setSourceHtml(event.target.value)}
              spellCheck={false}
              className="h-[220px] w-full resize-y rounded-md border border-[#d8d1c4] bg-[#fffdf8] p-3 font-mono text-[12px] leading-5 text-[#25221b] outline-none focus:border-[#b89143] dark:border-[#2b3643] dark:bg-[#0b1118] dark:text-[#dbe4f0]"
            />
          </div>

          <div className="min-h-[420px] overflow-hidden rounded-lg border border-[#ded8ca] bg-white dark:border-[#252e38] dark:bg-[#101720]">
            <div className="flex h-10 items-center justify-between border-b border-[#e7dfd1] px-3 dark:border-[#252e38]">
              <h2 className="mb-0 text-[14px] font-bold">预览</h2>
              <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
                {PAPER_SIZE[paper]} · {Math.round(scale * 100)}%
              </span>
            </div>
            <iframe
              title="HTML 转 PDF 预览"
              sandbox=""
              srcDoc={processedHtml}
              className="h-[640px] w-full bg-white"
            />
          </div>
        </div>
      </section>
    </main>
  )
}
