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

const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024

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

  const clipboardDocument = new DOMParser().parseFromString(html, 'text/html')
  const imageNodes = Array.from(clipboardDocument.body.querySelectorAll('img[src]'))
  let embeddedImages = 0

  await Promise.all(imageNodes.map(async (image) => {
    const source = image.getAttribute('src') || ''
    if (!source || source.startsWith('data:image/')) {
      if (source) embeddedImages += 1
      return
    }

    try {
      const absoluteUrl = new URL(source, window.location.href)
      const sameOrigin = absoluteUrl.origin === window.location.origin
      const response = await fetch(absoluteUrl.href, {
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
    } catch {
      // 保留远程 URL；部分编辑器仍能读取，调用方会提示可能需要手动补图。
    }
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
