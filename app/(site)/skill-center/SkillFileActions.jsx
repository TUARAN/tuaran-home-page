'use client'

import { useState } from 'react'

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
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#dedfd5] bg-[#f8f8f5] px-3 py-2 dark:border-[#263241] dark:bg-[#121a24]">
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
      const lines = [
        `# ${skill.title} (${skill.name})`,
        '',
        `Install path: ${skill.codex.installPath}`,
        '',
        '---',
        '',
        `## SKILL.md`,
        '',
        '```markdown',
        skill.codex.skillMd,
        '```',
        '',
        `## agents/openai.yaml`,
        '',
        '```yaml',
        skill.codex.openaiYaml,
        '```',
        '',
      ]
      downloadText(`${skill.name}.bundle.md`, lines.join('\n'))
      setState('done')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 1600)
  }

  async function handleCopyAll() {
    const text = `# ${skill.title} (${skill.name})\nInstall: ${skill.codex.installPath}\n\n## SKILL.md\n\n${skill.codex.skillMd}\n\n## agents/openai.yaml\n\n${skill.codex.openaiYaml}`
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
        ↓ 下载整套（{skill.codex.files.length} 个文件）
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
