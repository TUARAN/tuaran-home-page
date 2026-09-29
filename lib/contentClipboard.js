function splitMarkdownTableRow(line) {
  const source = String(line || '').trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells = []
  let cell = ''
  let escaped = false
  for (const character of source) {
    if (escaped) {
      cell += character
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += character
    }
  }
  if (escaped) cell += '\\'
  cells.push(cell.trim())
  return cells
}

function normalizeMarkdownTables(markdown) {
  const lines = String(markdown || '').split(/\r?\n/)
  const result = []
  let fence = ''
  for (let index = 0; index < lines.length; index += 1) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(lines[index])
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0]
      else if (fence === fenceMatch[1][0]) fence = ''
      result.push(lines[index])
      continue
    }
    if (fence) {
      result.push(lines[index])
      continue
    }
    const cells = splitMarkdownTableRow(lines[index])
    const separator = index + 1 < lines.length ? splitMarkdownTableRow(lines[index + 1]) : []
    const isTable = cells.length > 1
      && separator.length === cells.length
      && separator.every((cell) => /^:?-{3,}:?$/.test(cell))
    if (!isTable) {
      result.push(lines[index])
      continue
    }
    result.push(cells.join(' ｜ '))
    index += 2
    while (index < lines.length) {
      const row = splitMarkdownTableRow(lines[index])
      if (row.length !== cells.length || !lines[index].includes('|')) break
      result.push(row.join(' ｜ '))
      index += 1
    }
    index -= 1
  }
  return result.join('\n')
}

export function markdownToPlainText(markdown) {
  return normalizeMarkdownTables(markdown)
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

const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024
const CLIPBOARD_IMAGE_PROXY = 'https://wsrv.nl/'

function tableToXParagraphs(tableHtml) {
  const rows = Array.from(String(tableHtml || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi))
    .map((row) => Array.from(row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)))
    .filter((cells) => cells.length)
  if (!rows.length) return ''
  return rows.map((cells, rowIndex) => {
    const content = cells.map((cell) => cell[1].trim()).join(' ｜ ')
    return rowIndex === 0 ? `<p><strong>${content}</strong></p>` : `<p>${content}</p>`
  }).join('')
}

export function prepareXArticleHtml(html) {
  return String(html || '')
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, tableToXParagraphs)
    .replace(/<(\/?)h1\b/gi, '<$1h2')
}

export function buildClipboardImageCandidates(source) {
  const value = String(source || '').trim()
  if (!value) return []
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname === 'wsrv.nl') return [value]
    const proxy = new URL(CLIPBOARD_IMAGE_PROXY)
    proxy.searchParams.set('url', url.href)
    proxy.searchParams.set('output', 'png')
    return [value, proxy.href]
  } catch {
    return [value]
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('IMAGE_READ_FAILED'))
    reader.readAsDataURL(blob)
  })
}

async function inlineClipboardImages(html) {
  if (typeof DOMParser === 'undefined') {
    return { html, imageCount: 0, embeddedImages: 0 }
  }

  const clipboardDocument = new DOMParser().parseFromString(prepareXArticleHtml(html), 'text/html')
  const imageNodes = Array.from(clipboardDocument.body.querySelectorAll('img[src]'))
  let embeddedImages = 0

  await Promise.all(imageNodes.map(async (image) => {
    const source = image.getAttribute('src') || ''
    if (!source || source.startsWith('data:image/')) {
      if (source) embeddedImages += 1
      return
    }

    const absoluteUrl = new URL(source, window.location.href)
    for (const candidate of buildClipboardImageCandidates(absoluteUrl.href)) {
      try {
        const candidateUrl = new URL(candidate)
        const sameOrigin = candidateUrl.origin === window.location.origin
        const response = await fetch(candidateUrl.href, {
          credentials: sameOrigin ? 'same-origin' : 'omit',
          mode: 'cors',
        })
        if (!response.ok) throw new Error(`IMAGE_FETCH_${response.status}`)
        const blob = await response.blob()
        if (!blob.type.startsWith('image/') || blob.size > MAX_INLINE_IMAGE_BYTES) {
          throw new Error('IMAGE_UNSUPPORTED')
        }
        image.setAttribute('src', await blobToDataUrl(blob))
        image.removeAttribute('loading')
        image.removeAttribute('decoding')
        embeddedImages += 1
        return
      } catch {
        // 原地址受 CORS 限制时继续尝试只代理公开 HTTPS 图片的 PNG 版本。
      }
    }
    // 保留远程 URL；部分编辑器仍能读取，调用方会提示可能需要手动补图。
  }))

  return {
    html: clipboardDocument.body.innerHTML,
    imageCount: imageNodes.length,
    embeddedImages,
  }
}

export async function copyRichText({ html, text }) {
  const richHtml = String(html || '').trim()
  const plainText = String(text || '').trim()

  if (richHtml && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      let imageReport = { imageCount: 0, embeddedImages: 0 }
      const richBlob = inlineClipboardImages(richHtml).then((result) => {
        imageReport = result
        return new Blob([result.html], { type: 'text/html' })
      })
      const item = new ClipboardItem({
        'text/html': richBlob,
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return { copied: true, format: 'rich', ...imageReport }
    } catch {
      // Safari、Firefox 或剪贴板权限不支持富文本时复制纯文本。
    }
  }

  const copied = await copyPlainText(plainText)
  const imageCount = (richHtml.match(/<img\b/gi) || []).length
  return { copied, format: copied ? 'plain' : null, imageCount, embeddedImages: 0 }
}
