'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconBrandX,
  IconCheck,
  IconClipboard,
  IconDownload,
  IconExternalLink,
  IconRefresh,
  IconRocket,
  IconSearch,
} from '@tabler/icons-react'

import {
  ARTICLE_DISTRIBUTION_PLATFORMS,
  resolveArticleDistributionAccounts,
} from '../../../../lib/articleDistribution'
import AdminButton from '../../components/ui/AdminButton'
import AdminPage from '../../components/ui/AdminPage'
import Section from '../../components/ui/Section'
import StatusPill from '../../components/ui/StatusPill'

const PLATFORM_ICONS = {
  twitter: IconBrandX,
}

const EXTENSION_VERSION = '1.3.7'
const EXTENSION_DOWNLOAD_URL = '/downloads/2aran-article-distributor-extension-v1.3.7.zip'

const SOURCE_SELECTORS = [
  'article.prose-tuaran',
  'article.article-post-body',
  'main article',
  '.prose-tuaran',
]

const EXCLUDE_SELECTOR = [
  'script',
  'style',
  'nav',
  'footer',
  'aside',
  'button',
  'form',
  'iframe',
  '.not-prose',
  '.toc-scroll-panel',
  '[data-toc-item-id]',
  '[data-toc-subitem-id]',
  '[data-x-article-exclude]',
].join(',')

function cleanText(value) {
  return String(value || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function compareVersions(left, right) {
  const leftParts = String(left || '').split('.').map((part) => Number(part) || 0)
  const rightParts = String(right || '').split('.').map((part) => Number(part) || 0)
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index += 1) {
    if ((leftParts[index] || 0) !== (rightParts[index] || 0)) {
      return (leftParts[index] || 0) - (rightParts[index] || 0)
    }
  }
  return 0
}

function absoluteUrl(value, sourceUrl) {
  try {
    const parsed = new URL(String(value || ''), sourceUrl)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

function markdownFromNode(node, sourceUrl, depth = 0) {
  if (!node || depth > 30) return ''
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const tag = node.tagName.toLowerCase()
  const children = () => Array.from(node.childNodes)
    .map((child) => markdownFromNode(child, sourceUrl, depth + 1))
    .join('')

  if (tag === 'br') return '\n'
  if (tag === 'hr') return '\n\n---\n\n'
  if (tag === 'img') {
    const src = absoluteUrl(node.getAttribute('src') || node.getAttribute('data-src'), sourceUrl)
    return src ? `![${cleanText(node.getAttribute('alt'))}](${src})` : ''
  }
  if (tag === 'a') {
    const label = cleanText(children())
    const href = absoluteUrl(node.getAttribute('href'), sourceUrl)
    return href && label ? `[${label}](${href})` : label
  }
  if (['strong', 'b'].includes(tag)) return `**${cleanText(children())}**`
  if (['em', 'i'].includes(tag)) return `*${cleanText(children())}*`
  if (tag === 'code' && node.parentElement?.tagName !== 'PRE') return `\`${cleanText(children())}\``
  if (tag === 'pre') return `\n\n\`\`\`\n${String(node.textContent || '').trim()}\n\`\`\`\n\n`
  if (tag === 'table') {
    const rows = Array.from(node.querySelectorAll('tr'))
      .map((row) => Array.from(row.querySelectorAll(':scope > th, :scope > td'))
        .map((cell) => cleanText(cell.textContent))
        .filter(Boolean)
        .join(' ｜ '))
      .filter(Boolean)
    return rows.length ? `\n\n${rows.join('\n\n')}\n\n` : ''
  }
  if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag.slice(1)))} ${cleanText(children())}\n\n`
  if (tag === 'blockquote') {
    const content = cleanText(children()).split('\n').map((line) => `> ${line}`).join('\n')
    return `\n\n${content}\n\n`
  }
  if (tag === 'li') {
    const ordered = node.parentElement?.tagName === 'OL'
    const index = ordered ? Array.from(node.parentElement.children).indexOf(node) + 1 : 0
    return `\n${ordered ? `${index}.` : '-'} ${cleanText(children())}`
  }
  if (['p', 'div', 'figure', 'figcaption', 'table', 'tr'].includes(tag)) return `\n\n${children()}\n\n`
  return children()
}

function normalizeArticleDocument(doc, sourceUrl, fallbackTitle) {
  const source = SOURCE_SELECTORS.map((selector) => doc.querySelector(selector)).find(Boolean)
  if (!source) throw new Error('没有识别到文章正文区域。')
  const clone = source.cloneNode(true)
  clone.querySelectorAll(EXCLUDE_SELECTOR).forEach((node) => node.remove())
  clone.querySelectorAll('a[href]').forEach((node) => {
    const href = absoluteUrl(node.getAttribute('href'), sourceUrl)
    if (href) node.setAttribute('href', href)
  })
  clone.querySelectorAll('img').forEach((node) => {
    const src = absoluteUrl(node.currentSrc || node.getAttribute('src') || node.getAttribute('data-src'), sourceUrl)
    if (src) node.setAttribute('src', src)
    node.removeAttribute('srcset')
    node.removeAttribute('loading')
  })

  const title = cleanText(fallbackTitle || doc.querySelector('h1')?.textContent || doc.title).slice(0, 200)
  const markdown = cleanText(markdownFromNode(clone, sourceUrl)).slice(0, 200000)
  const text = cleanText(clone.textContent).slice(0, 200000)
  const firstImage = clone.querySelector('img[src]')?.getAttribute('src') || ''
  const firstParagraph = cleanText(clone.querySelector('p')?.textContent || text).slice(0, 160)
  if (!title || !text) throw new Error('文章标题或正文为空。')
  return {
    title,
    content: clone.innerHTML,
    markdown,
    desc: firstParagraph,
    thumb: firstImage,
    sourceUrl,
  }
}

async function writeRichClipboard(article) {
  if (!article) throw new Error('请先载入文章。')
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([article.content], { type: 'text/html' }),
        'text/plain': new Blob([article.markdown], { type: 'text/plain' }),
      }),
    ])
    return
  }
  await navigator.clipboard.writeText(article.markdown)
}

function platformStatusTone(status) {
  if (status === 'done') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'uploading') return 'info'
  return 'neutral'
}

function contentKeyFromLocation(fallback = '') {
  if (typeof window === 'undefined') return fallback
  return new URLSearchParams(window.location.search).get('contentKey')?.trim() || fallback
}

export default function ArticleDistributionClient({ requestedContentKey = '' }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState(requestedContentKey)
  const [selectedKey, setSelectedKey] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => ARTICLE_DISTRIBUTION_PLATFORMS.map((item) => item.id))
  const [plugin, setPlugin] = useState({ ready: false, detected: false, updateRequired: false, version: '' })
  const [article, setArticle] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [statusAccounts, setStatusAccounts] = useState([])
  const [message, setMessage] = useState('先选择一篇文章，再检查插件。')
  const [loading, setLoading] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.contentKey === selectedKey) || null,
    [items, selectedKey],
  )

  const detectPlugin = useCallback(async ({ reloadIfMissing = false } = {}) => {
    const extension = window.$cose
    const detected = typeof extension?.addTask === 'function' && typeof extension?.getPlatforms === 'function'
    const version = String(extension?.version || '')
    const updateRequired = detected && (!version || compareVersions(version, EXTENSION_VERSION) < 0)
    const ready = detected && !updateRequired
    setPlugin({ ready, detected, updateRequired, version })
    if (!detected) {
      setAccounts([])
      if (reloadIfMissing) {
        setMessage('正在刷新当前页面并重新连接插件…')
        window.location.reload()
        return
      }
      setMessage('未检测到 2aran 文章分发助手。安装或重新加载插件后，点击“检查插件”即可重新连接。')
      return
    }
    if (updateRequired) {
      setAccounts([])
      setMessage(`检测到旧版插件${version ? `（v${version}）` : ''}。当前页面需要 v${EXTENSION_VERSION} 或更高版本，请下载新版、在扩展程序页面重新加载，然后再检查。`)
      return
    }
    const platforms = extension.getPlatforms() || []
    let detectedAccounts = platforms
    if (typeof extension.getAccounts === 'function') {
      try {
        const result = await extension.getAccounts()
        if (Array.isArray(result) && result.length) detectedAccounts = result
      } catch (error) {
        // 扩展重新加载后，旧页面里的桥接对象还在，但其 Chrome runtime 已失效。
        // 手动检查时刷新页面，让 content script 在当前标签页重新注入。
        setPlugin({ ready: false, detected: true, updateRequired: false, version })
        setAccounts([])
        if (reloadIfMissing) {
          setMessage('插件已更新，正在刷新当前页面并重新连接…')
          window.location.reload()
          return
        }
        setMessage(error?.message || '插件连接已失效，请点击“检查插件”重新连接。')
        return
      }
    }
    setAccounts(detectedAccounts)
    setMessage(`插件 v${version} 已连接，可写入平台草稿。`)
  }, [])

  const loadItems = useCallback(async (search = '', preferredContentKey = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'all', status: 'published', limit: '100' })
      if (search.trim()) params.set('q', search.trim())
      const response = await fetch(`/api/admin/content-list?${params}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.detail || payload?.error || '内容读取失败')
      const nextItems = (payload.items || []).filter((item) => ['article', 'research'].includes(item.type) && /^\/articles\//.test(item.href))
      setItems(nextItems)
      setSelectedKey((current) => {
        if (preferredContentKey) {
          return nextItems.some((item) => item.contentKey === preferredContentKey) ? preferredContentKey : ''
        }
        return nextItems.some((item) => item.contentKey === current) ? current : (nextItems[0]?.contentKey || '')
      })
    } catch (error) {
      setMessage(error.message || '内容读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const targetContentKey = contentKeyFromLocation(requestedContentKey)
    setQuery(targetContentKey)
    loadItems(targetContentKey, targetContentKey)
    detectPlugin()
    window.addEventListener('cose-ready', detectPlugin)
    return () => window.removeEventListener('cose-ready', detectPlugin)
  }, [detectPlugin, loadItems, requestedContentKey])

  useEffect(() => {
    setArticle(null)
    setStatusAccounts([])
  }, [selectedKey])

  async function prepareArticle() {
    if (!selectedItem) return null
    setLoading(true)
    setMessage('正在读取站内文章正文与图片…')
    try {
      const response = await fetch(`/api/admin/article-distribution/article?href=${encodeURIComponent(selectedItem.href)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`文章页面读取失败（HTTP ${response.status}）`)
      const payload = await response.json()
      const html = payload.html
      const sourceUrl = payload.sourceUrl
      if (!html || !sourceUrl) throw new Error(payload?.detail || payload?.error || '文章页面内容为空')
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const prepared = normalizeArticleDocument(doc, sourceUrl, selectedItem.title)
      setArticle(prepared)
      setMessage(`已载入《${prepared.title}》，正文约 ${prepared.markdown.length.toLocaleString('zh-CN')} 字符。`)
      return prepared
    } catch (error) {
      setMessage(error.message || '文章读取失败。')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function copyArticle() {
    const prepared = article || await prepareArticle()
    if (!prepared) return
    try {
      await writeRichClipboard(prepared)
      setMessage('已复制带格式正文，可在平台编辑器手动粘贴。')
    } catch (error) {
      setMessage(`复制失败：${error.message || '浏览器未授权剪贴板'}`)
    }
  }

  async function distribute() {
    const prepared = article || await prepareArticle()
    if (!prepared) return
    if (!plugin.ready || typeof window.$cose?.addTask !== 'function') {
      await copyArticle()
      setMessage('插件未连接；正文已复制，请安装插件后重试。')
      return
    }
    const targets = resolveArticleDistributionAccounts(accounts, selectedPlatforms)
    if (!targets.length) {
      setMessage('所选平台不在当前插件能力中，请重新加载最新版插件。')
      return
    }

    setLoading(true)
    setStatusAccounts(targets.map((account) => ({ ...account, status: 'pending', msg: '等待中' })))
    setMessage(`正在依次写入 ${targets.length} 个平台草稿，请不要关闭新打开的标签页。`)
    try {
      await new Promise((resolve, reject) => {
        try {
          window.$cose.addTask(
            {
              post: {
                title: prepared.title,
                content: prepared.content,
                markdown: prepared.markdown,
                thumb: prepared.thumb,
                desc: prepared.desc,
                contentType: 'article',
                url: prepared.sourceUrl,
              },
              accounts: targets,
            },
            (next) => setStatusAccounts(next?.accounts || targets),
            resolve,
          )
        } catch (error) {
          reject(error)
        }
      })
      setStatusAccounts((current) => current.map((account) => account.status === 'pending' ? { ...account, status: 'done', msg: '已写入草稿' } : account))
      setMessage('分发任务已完成。请逐个平台检查标题、图片、分类和发布设置后再提交。')
    } catch (error) {
      setMessage(`分发任务中断：${error.message || '插件调用失败'}`)
    } finally {
      setLoading(false)
    }
  }

  function togglePlatform(id) {
    setSelectedPlatforms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <AdminPage
      title="文章一键分发"
      description="从站内选择公开文章，通过浏览器中的登录态写入六个平台草稿；首期保留人工发布确认。"
      actions={(
        <>
          <AdminButton type="button" onClick={() => detectPlugin({ reloadIfMissing: true })} disabled={loading}>
            <IconRefresh size={16} /> 检查插件
          </AdminButton>
          <AdminButton type="button" variant="primary" onClick={distribute} disabled={loading || !selectedItem || selectedPlatforms.length === 0}>
            <IconRocket size={16} /> 写入所选草稿
          </AdminButton>
        </>
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="space-y-5">
          <Section title="1. 选择站内文章" description="只显示已公开的文章与调研；不会读取草稿或私密内容。">
            <form
              className="mb-4 flex gap-2"
              onSubmit={(event) => { event.preventDefault(); loadItems(query) }}
            >
              <label className="relative block min-w-0 flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929487]" size={16} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题或 contentKey"
                  className="h-9 w-full rounded-lg border border-[#d8dad0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f]"
                />
              </label>
              <AdminButton type="submit" disabled={loading}>搜索</AdminButton>
            </form>
            <select
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#d8dad0] bg-white px-3 text-sm outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f]"
            >
              {items.length ? null : <option value="">暂无可分发文章</option>}
              {items.map((item) => (
                <option key={item.contentKey} value={item.contentKey}>{item.title} · {item.type === 'research' ? '调研' : '文章'}</option>
              ))}
            </select>
            {selectedItem ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#67695d] dark:text-gray-400">
                <span>{selectedItem.contentKey}</span>
                <span>·</span>
                <a href={selectedItem.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#15140f] dark:hover:text-white">
                  打开原文 <IconExternalLink size={13} />
                </a>
              </div>
            ) : null}
          </Section>

          <Section title="2. 选择平台" description="首期固定六个平台；后续平台继续按适配器追加。">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ARTICLE_DISTRIBUTION_PLATFORMS.map((platform) => {
                const checked = selectedPlatforms.includes(platform.id)
                const account = accounts.find((item) => (item.uid || item.type) === platform.id)
                const Icon = PLATFORM_ICONS[platform.id]
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    aria-pressed={checked}
                    className={`rounded-xl border p-3 text-left transition ${checked ? 'border-[#7f8863] bg-[#f1f2ea] dark:border-[#82906a] dark:bg-[#151c26]' : 'border-[#d8dad0] bg-white hover:border-[#a6aa9a] dark:border-[#2d3744] dark:bg-[#10161f]'}`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon ? <Icon size={18} /> : <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-[#e7e8df] text-[10px] font-bold dark:bg-[#263142]">{platform.shortLabel.slice(0, 1)}</span>}
                      <span className="min-w-0 flex-1 text-sm font-semibold">{platform.label}</span>
                      {checked ? <IconCheck size={16} /> : null}
                    </div>
                    <p className="mb-0 mt-2 text-[11px] text-[#7b7d72] dark:text-gray-500">
                      {account?.loggedIn ? '已登录' : account ? '未确认登录态' : plugin.ready ? '当前插件未声明' : '等待插件检测'}
                    </p>
                  </button>
                )
              })}
            </div>
          </Section>

          {selectedPlatforms.includes('twitter') ? (
            <Section
              title="X 发布格式速查"
              description="富文本是平台能力；纯文本是兼容策略。当前分发目标是 X Articles，不是普通 Post。"
            >
              <div className="space-y-4 text-xs leading-6 text-[#53554d] dark:text-gray-300">
                <div className="rounded-lg border border-[#e1e2da] bg-[#fafaf7] px-3.5 py-3 dark:border-[#263142] dark:bg-[#0d131c]">
                  <p className="m-0 font-semibold text-[#24261f] dark:text-gray-100">X Articles（当前分发目标）</p>
                  <p className="mb-0 mt-1">
                    平台原生支持标题、加粗、斜体、删除线、缩进、编号或项目列表、链接，以及图片、视频、GIF 和 X 帖子嵌入；官方能力清单没有表格。
                  </p>
                </div>

                <div>
                  <p className="m-0 font-semibold text-[#24261f] dark:text-gray-100">同时适配 X 与模型解析</p>
                  <ol className="mb-0 mt-1 list-decimal space-y-1 pl-5">
                    <li>不要输出 Markdown 表格。数据改成“字段：内容”，多列对比改成“项目 A ｜ 项目 B”的逐行文本。</li>
                    <li>插件写入时保留 X 原生标题层级；需要复制给模型时，改用“一、二、三、3.1”这类纯文本标题，不保留 #、##。</li>
                    <li>段落之间只留一个空行；一个完整语义段落放在同一行，避免每句话单独换行。</li>
                    <li>列表使用单层“- ”或数字序号，不嵌套多层列表。</li>
                    <li>模型版链接使用“说明文字：https://...”完整 URL；不要只保留 Markdown 的“[文字](URL)”外壳。</li>
                    <li>模型版不使用代码围栏、行内反引号、Markdown 分隔线和 HTML 标签；代码或参数改成“字段：值”的普通文本。</li>
                    <li>加粗、斜体属于 X 富文本能力；模型版去掉 **、* 等 Markdown 标记，中文正文使用常规中文标点。</li>
                    <li>正文图片由插件上传到 X。浏览器剪贴板只能尽力携带图片，粘贴后仍要核对图片数量和位置。</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                  <p className="m-0 font-semibold">普通 Post / Premium 长 Post</p>
                  <p className="mb-0 mt-1">
                    普通 Post 上限 280 字符；Premium 长 Post 上限 25,000 字符。两者最多附带 4 个媒体项目；完整 URL 会由 t.co 处理，并按 23 个字符计入 Post 字数。它们不使用 Articles 的章节排版流程。
                  </p>
                </div>
              </div>
            </Section>
          ) : null}
        </div>

        <div className="space-y-5">
          <Section title="插件与任务状态" description="登录态保留在浏览器中，本站不保存平台 Cookie。">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={plugin.ready ? 'success' : 'warning'}>
                {plugin.ready ? '插件已连接' : plugin.updateRequired ? '插件需更新' : '插件未连接'}
              </StatusPill>
              {plugin.version ? <StatusPill tone="neutral">v{plugin.version}</StatusPill> : null}
              <StatusPill tone="info">草稿模式</StatusPill>
            </div>
            <p className="mb-0 mt-3 text-sm leading-6 text-[#53554d] dark:text-gray-300">{message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminButton href={EXTENSION_DOWNLOAD_URL} download prefetch={false}>
                <IconDownload size={15} /> 下载 Chrome 插件 v{EXTENSION_VERSION}
              </AdminButton>
              <AdminButton type="button" onClick={prepareArticle} disabled={loading || !selectedItem}>载入并预检</AdminButton>
              <AdminButton type="button" onClick={copyArticle} disabled={loading || !selectedItem}>
                <IconClipboard size={15} /> 复制文章
              </AdminButton>
            </div>
            <ol className="mb-0 mt-4 list-decimal space-y-1 pl-5 text-xs leading-5 text-[#7b7d72] dark:text-gray-500">
              <li>下载并解压 ZIP。</li>
              <li>打开 Chrome 的扩展程序页面，开启开发者模式。</li>
              <li>选择“加载已解压的扩展程序”，载入解压后的目录，再点击页面顶部的“检查插件”。</li>
            </ol>
          </Section>

          <Section title="逐平台结果" description="成功表示已写入编辑器；最终发布状态以平台页面为准。">
            {statusAccounts.length ? (
              <div className="space-y-2">
                {statusAccounts.map((account) => (
                  <div key={`${account.uid || account.type}-${account.displayName || account.title}`} className="flex items-center gap-3 rounded-lg border border-[#e1e2da] px-3 py-2.5 dark:border-[#263142]">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{account.title || account.displayName || account.type}</span>
                    <StatusPill tone={platformStatusTone(account.status)} size="sm">{account.error || account.msg || account.status || '等待中'}</StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-sm text-[#7b7d72] dark:text-gray-500">尚未执行分发任务。</p>
            )}
          </Section>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            首期不会自动点击平台的“发布”按钮。分类、封面、声明、原创标记和平台风控提示仍需人工确认。
          </div>
        </div>
      </div>
    </AdminPage>
  )
}
