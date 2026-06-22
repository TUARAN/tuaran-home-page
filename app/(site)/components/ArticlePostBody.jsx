function safeUrl(value, { image = false } = {}) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url
  if (!image && /^(mailto:|tel:)/i.test(url)) return url
  return ''
}

function textContent(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (node.content || []).map(textContent).join('')
}

function renderText(node, key) {
  let output = node.text || ''
  for (const mark of node.marks || []) {
    if (mark.type === 'bold') output = <strong key={`${key}-bold`}>{output}</strong>
    else if (mark.type === 'italic') output = <em key={`${key}-italic`}>{output}</em>
    else if (mark.type === 'strike') output = <s key={`${key}-strike`}>{output}</s>
    else if (mark.type === 'code') output = <code key={`${key}-code`}>{output}</code>
    else if (mark.type === 'link') {
      const href = safeUrl(mark.attrs?.href)
      if (href) output = <a key={`${key}-link`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>{output}</a>
    }
  }
  return output
}

function renderNodes(nodes, prefix = 'node') {
  return (nodes || []).map((node, index) => renderNode(node, `${prefix}-${index}`))
}

function renderNode(node, key) {
  if (!node) return null
  if (node.type === 'text') return <span key={key}>{renderText(node, key)}</span>
  if (node.type === 'hardBreak') return <br key={key} />
  const children = renderNodes(node.content, key)
  if (node.type === 'paragraph') return <p key={key}>{children.length ? children : <br />}</p>
  if (node.type === 'heading') {
    if (node.attrs?.level === 3) return <h3 key={key}>{children}</h3>
    return <h2 key={key}>{children}</h2>
  }
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>
  if (node.type === 'orderedList') return <ol key={key} start={node.attrs?.start || 1}>{children}</ol>
  if (node.type === 'listItem') return <li key={key}>{children}</li>
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>
  if (node.type === 'codeBlock') return <pre key={key}><code>{textContent(node)}</code></pre>
  if (node.type === 'horizontalRule') return <hr key={key} />
  if (node.type === 'image') {
    const src = safeUrl(node.attrs?.src, { image: true })
    if (!src) return null
    // 正文图片来自 Owner 可配置的 R2/HTTPS 地址，使用原生 img 避免静态域名白名单。
    // eslint-disable-next-line @next/next/no-img-element
    return <figure key={key}><img src={src} alt={node.attrs?.alt || ''} loading="lazy" /><figcaption>{node.attrs?.title || ''}</figcaption></figure>
  }
  return children.length ? <div key={key}>{children}</div> : null
}

export default function ArticlePostBody({ content, className = '' }) {
  const doc = content && typeof content === 'object' ? content : { content: [] }
  return <article className={`prose-tuaran article-post-body ${className}`}>{renderNodes(doc.content)}</article>
}
