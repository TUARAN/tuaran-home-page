export function markdownToPlainText(markdown) {
  return String(markdown || '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g, (_, alt, url) => {
      const label = String(alt || '').trim()
      return label ? `${label}\n${url}` : url
    })
    .replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g, '$1 ($2)')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/(^|[^\\])([*_~]){1,2}([^\n]*?)\2{1,2}/g, '$1$3')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function copyPlainText(text) {
  const value = String(text || '')
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // 非安全上下文或权限被拒绝时退化到 execCommand。
  }

  const ta = document.createElement('textarea')
  ta.value = value
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(ta)
  }
}

export async function copyRichText({ html, text }) {
  const richHtml = String(html || '').trim()
  const plainText = String(text || '').trim()

  if (richHtml && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([richHtml], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return { copied: true, format: 'rich' }
    } catch {
      // Safari、Firefox 或剪贴板权限不支持富文本时复制纯文本。
    }
  }

  const copied = await copyPlainText(plainText)
  return { copied, format: copied ? 'plain' : null }
}
