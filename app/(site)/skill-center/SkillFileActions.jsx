'use client'

import { useEffect, useRef, useState } from 'react'

import { getSkillFileEntries } from './skillFiles'

function basename(path) {
  const parts = String(path || '').split('/')
  return parts[parts.length - 1] || 'file'
}

function inferMime(filename) {
  const f = String(filename || '').toLowerCase()
  if (f.endsWith('.md')) return 'text/markdown;charset=utf-8'
  if (f.endsWith('.yaml') || f.endsWith('.yml')) return 'application/x-yaml;charset=utf-8'
  if (f.endsWith('.json')) return 'application/json;charset=utf-8'
  return 'text/plain;charset=utf-8'
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: inferMime(filename) })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = basename(filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

async function copyText(content) {
  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    return false
  }
}

export function SkillFileButton({ filename, content }) {
  const [copyState, setCopyState] = useState('idle')

  async function handleCopy() {
    setCopyState('copying')
    const ok = await copyText(content)
    setCopyState(ok ? 'copied' : 'error')
    setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#dedfd5] py-3 dark:border-[#263241]">
      <span className="grow truncate font-mono text-xs text-[#4a4c3f] dark:text-gray-300">{filename}</span>
      <button
        type="button"
        onClick={() => downloadText(filename, content)}
        className="inline-flex items-center gap-1 rounded-full border border-[#cccdc2] bg-white px-2.5 py-1 font-mono text-[11px] text-[#555640] transition-colors hover:border-[#a4a893] hover:text-[#1c1d18] dark:border-[#334052] dark:bg-[#0f1820] dark:text-[#c9d6e5] dark:hover:border-[#5a6d85] dark:hover:text-white"
      >
        ↓ 下载
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-full border border-[#cccdc2] bg-white px-2.5 py-1 font-mono text-[11px] text-[#555640] transition-colors hover:border-[#a4a893] hover:text-[#1c1d18] dark:border-[#334052] dark:bg-[#0f1820] dark:text-[#c9d6e5] dark:hover:border-[#5a6d85] dark:hover:text-white"
      >
        {copyState === 'copied' ? '✓ 已复制' : copyState === 'error' ? '× 失败' : '⧉ 复制'}
      </button>
    </div>
  )
}

export function SkillBundleButton({ skill }) {
  const [state, setState] = useState('idle')

  async function handleDownloadAll() {
    setState('working')
    try {
      const files = getSkillFileEntries(skill)
      const lines = [
        `# ${skill.title} (${skill.name})`,
        '',
        `Install path: ${skill.codex.installPath}`,
        '',
        '---',
        '',
      ]
      files.forEach((file) => {
        const lang = file.filename.endsWith('.yaml') || file.filename.endsWith('.yml')
          ? 'yaml'
          : file.filename.endsWith('.md')
            ? 'markdown'
            : ''
        lines.push(`## ${file.filename}`, '', `\`\`\`${lang}`, file.content, '```', '')
      })
      downloadText(`${skill.name}.bundle.md`, lines.join('\n'))
      setState('done')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 1600)
  }

  async function handleCopyAll() {
    const files = getSkillFileEntries(skill)
    const text = [
      `# ${skill.title} (${skill.name})`,
      `Install: ${skill.codex.installPath}`,
      '',
      ...files.flatMap((file) => [`## ${file.filename}`, '', file.content, '']),
    ].join('\n')
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'error')
    setTimeout(() => setState('idle'), 1600)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleDownloadAll}
        className="inline-flex items-center gap-1 rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]"
      >
        ↓ 下载整套（{getSkillFileEntries(skill).length} 个文件）
      </button>
      <button
        type="button"
        onClick={handleCopyAll}
        className="inline-flex items-center gap-1 rounded-full border border-[#cccdc2] bg-white px-3 py-1.5 font-mono text-xs text-[#555640] transition-colors hover:border-[#a4a893] hover:text-[#1c1d18] dark:border-[#334052] dark:bg-[#0f1820] dark:text-[#c9d6e5] dark:hover:border-[#5a6d85] dark:hover:text-white"
      >
        {state === 'copied' ? '✓ 已复制全部' : '⧉ 复制全部'}
      </button>
    </div>
  )
}

export function SkillInstallPanel({ skill }) {
  const [open, setOpen] = useState(false)
  const closeButtonRef = useRef(null)
  const files = getSkillFileEntries(skill)
  const titleId = `skill-install-${skill.id}`

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]">
        查看安装与文件 <span className="opacity-75">· {files.length}</span> →
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-full w-full flex-col bg-white shadow-2xl dark:bg-[#0d151e] sm:h-auto sm:max-h-[84vh] sm:max-w-3xl sm:rounded-xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#dedfd5] px-4 py-4 dark:border-[#263241] sm:px-6">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b5a1f] dark:text-[#a1ab76]">Skill 安装与文件</p>
                <h2 id={titleId} className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100 sm:text-2xl">{skill.title}</h2>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="关闭安装面板" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[#555640] hover:bg-[#eaebe3] dark:text-gray-300 dark:hover:bg-[#17212d]">×</button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SkillBundleButton skill={skill} />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6e7064] dark:text-gray-400">{files.length} files</span>
              </div>
              <div className="mt-4 space-y-2">
                {files.map((file) => <SkillFileButton key={file.filename} filename={file.filename} content={file.content} />)}
              </div>
              <p className="mb-0 mt-4 bg-[#f3f1ea] p-3 text-xs leading-5 text-[#56564d] dark:bg-[#121a24] dark:text-gray-300">
                安装到 <code className="font-mono text-[10px] text-[#8b5a1f] dark:text-[#a1ab76]">{skill.codex.installPath}</code>；SKILL.md 也可作为其他智能体的 system prompt。
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
