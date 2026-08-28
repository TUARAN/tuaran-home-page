const state = {
  resources: [],
  categories: [],
  selectedCategory: '全部资源',
  search: '',
  featuredOnly: false,
  me: null,
  activeSlug: null,
  total: 0, page: 1, hasMore: false, requestId: 0,
}

const colorMap = {
  orange: '#ff855f', blue: '#8fc9ff', violet: '#b7a5ff', pink: '#ff9ab5',
  teal: '#83ddc4', gold: '#f5ca61', lime: '#d8ff65',
}

const grid = document.querySelector('#resourceGrid')
const filters = document.querySelector('#categoryFilters')
const searchInput = document.querySelector('#searchInput')
const resultCount = document.querySelector('#resultCount')
const emptyState = document.querySelector('#emptyState')
const dialog = document.querySelector('#resourceDialog')
const dialogContent = document.querySelector('#dialogContent')
const balanceText = document.querySelector('#balanceText')
const toast = document.querySelector('#toast')
const loadMore = document.querySelector('#loadMore')

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600)
}

function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function renderFilters() {
  filters.innerHTML = ['全部资源', ...state.categories]
    .map((category) => `<button class="filter-button ${category === state.selectedCategory ? 'active' : ''}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    .join('')
  filters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category
      renderFilters()
      loadCatalog()
    })
  })
}

function renderResources() {
  const resources = state.resources
  resultCount.textContent = `${state.total} 项资源${state.featuredOnly ? ' · 只看精选' : ''}${state.hasMore ? ` · 已展示 ${resources.length} 项` : ''}`
  loadMore.hidden = !state.hasMore
  emptyState.hidden = resources.length > 0
  grid.hidden = resources.length === 0
  grid.innerHTML = resources.map((item, index) => {
    const color = colorMap[item.color] || colorMap.lime
    const availability = item.fileCount > 0 ? `${item.fileCount} 个文件` : '文件待导入'
    return `
      <article class="resource-card" tabindex="0" role="button" data-slug="${escapeHtml(item.slug)}" aria-label="查看 ${escapeHtml(item.title)}">
        <div class="card-cover" style="--cover-color:${color}">
          <div class="cover-grid"></div><div class="cover-orb"></div>
          <span class="cover-number">WB / ${String(index + 1).padStart(2, '0')}</span>
          <strong class="cover-title">${escapeHtml(item.title)}</strong>
          <span class="cover-format">${escapeHtml(item.format)}</span>
        </div>
        <div class="card-body">
          <div class="card-meta"><span>${escapeHtml(item.category)}</span>${item.featured ? '<span class="featured-tag">编辑精选</span>' : ''}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <div class="card-footer">
            <div><span class="cost">🔥 ${item.costPoints} 燃币</span><span class="availability">${availability}</span></div>
            <span class="card-arrow">↗</span>
          </div>
        </div>
      </article>`
  }).join('')

  grid.querySelectorAll('.resource-card').forEach((card) => {
    const open = () => openResource(card.dataset.slug)
    card.addEventListener('click', open)
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() }
    })
  })
}

async function loadCatalog({ append = false } = {}) {
  const requestId = ++state.requestId
  const page = append ? state.page + 1 : 1
  const query = new URLSearchParams({ q: state.search, category: state.selectedCategory, page: String(page), featured: state.featuredOnly ? '1' : '0' })
  loadMore.disabled = true
  grid.setAttribute('aria-busy', 'true')
  try {
    const response = await fetch(`/api/resources?${query}`)
    if (!response.ok) throw new Error('catalog failed')
    const data = await response.json()
    if (requestId !== state.requestId) return
    state.resources = append ? [...state.resources, ...(data.resources || [])] : data.resources || []
    state.total = data.total || 0
    state.page = data.page || 1
    state.hasMore = Boolean(data.hasMore)
    state.categories = data.categories || []
    renderFilters()
    renderResources()
  } catch {
    if (requestId !== state.requestId) return
    if (append) { showToast('加载失败，请重试'); return }
    grid.innerHTML = ''
    grid.hidden = true
    emptyState.hidden = false
    emptyState.querySelector('h3').textContent = '资源目录暂时不可用'
    emptyState.querySelector('p').textContent = '稍后刷新页面再试。'
    resultCount.textContent = '读取失败'
  } finally {
    if (requestId === state.requestId) { loadMore.disabled = false; grid.setAttribute('aria-busy', 'false') }
  }
}

async function loadMe() {
  try {
    const response = await fetch('/api/me')
    if (!response.ok) throw new Error('me failed')
    state.me = await response.json()
    balanceText.textContent = `${state.me.balance} 燃币`
    document.querySelectorAll('[data-guest-seed]').forEach((element) => { element.textContent = state.me.guestSeed })
  } catch {
    balanceText.textContent = '燃币暂不可用'
  }
}

function fileActions(resource, access) {
  if (!access.unlocked || !resource.files?.length) return ''
  const hasVideo = resource.files.some((file) => file.contentType.startsWith('video/'))
  return `<section class="resource-files"><h3>资源文件</h3>${hasVideo ? '<div id="coursePlayer" class="course-player" hidden><p id="courseTitle"></p><video id="courseVideo" controls playsinline preload="none"></video><p>播放失败时可下载到本地观看。</p></div>' : ''}<div class="file-list">${resource.files.map((file) => {
    const base = `/api/resources/${encodeURIComponent(resource.slug)}/files/${encodeURIComponent(file.id)}`
    const video = file.contentType.startsWith('video/')
    const readLink = file.delivery === 'download' ? '' : video
      ? `<button type="button" data-play-video="${base}?mode=read" data-video-title="${escapeHtml(file.label)}">播放 ▷</button>`
      : `<a href="${base}?mode=read" target="_blank" rel="noopener">${file.contentType.startsWith('image/') ? '查看' : '阅读'} ↗</a>`
    return `<div class="file-link"><span>${escapeHtml(file.label)} ${formatSize(file.sizeBytes)}</span><span class="file-actions">${readLink}<a href="${base}?mode=download">下载 ↓</a></span></div>`
  }).join('')}</div></section>`
}

function detailTemplate(resource, access) {
  const color = colorMap[resource.color] || colorMap.lime
  const highlights = resource.highlights?.length ? resource.highlights : ['内容结构清晰，方便按需查阅', '一次解锁，后续可重复使用', '资源文件上传后开放阅读与下载']
  const noFile = resource.fileCount < 1
  let buttonText = access.unlocked ? (noFile ? '已解锁 · 文件待导入' : '已解锁') : `使用 ${resource.costPoints} 燃币解锁`
  if (noFile && !access.unlocked) buttonText = '文件待导入 · 暂不扣币'
  return `
    <div class="dialog-hero" style="--cover-color:${color}">
      <span class="dialog-kicker">${escapeHtml(resource.category)} · ${escapeHtml(resource.format)}</span>
      <h2>${escapeHtml(resource.title)}</h2>
      <p>${escapeHtml(resource.eyebrow || resource.summary)}</p>
    </div>
    <div class="dialog-body">
      <div class="dialog-copy">
        <h3>这份资源能帮你做什么</h3>
        <p>${escapeHtml(resource.description || resource.summary)}</p>
        <ul class="highlight-list">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
      <aside class="access-panel">
        <small>RESOURCE ACCESS</small>
        <div class="access-price">🔥 ${resource.costPoints} <span>燃币 / 永久</span></div>
        <p class="access-note">${access.unlocked ? '这项资源已经属于你，重复打开不会再次消耗燃币。' : noFile ? '文件还没有导入。为避免空解锁，当前不会扣除燃币。' : `当前余额 ${access.balance} 燃币，确认后立即获得永久访问权限。`}</p>
        <button class="access-button ${access.unlocked ? 'unlocked' : ''}" id="unlockButton" type="button" ${(noFile || access.unlocked) ? 'disabled' : ''}>${buttonText}</button>
        <div class="status-line"><span>当前余额</span><b>${access.balance} 🔥</b></div>
        <div class="status-line"><span>文件状态</span><b>${noFile ? '待导入' : `${resource.fileCount} 个可用`}</b></div>
      </aside>
      ${fileActions(resource, access)}
    </div>`
}

async function openResource(slug, pushHistory = true) {
  state.activeSlug = slug
  dialogContent.innerHTML = '<div class="skeleton-card" style="height:620px"></div>'
  if (!dialog.open) dialog.showModal()
  document.body.classList.add('dialog-open')
  if (pushHistory) history.pushState({ slug }, '', `/resource/${encodeURIComponent(slug)}`)

  try {
    const response = await fetch(`/api/resources/${encodeURIComponent(slug)}`)
    if (!response.ok) throw new Error('detail failed')
    const data = await response.json()
    dialogContent.innerHTML = detailTemplate(data.resource, data.access)
    const unlockButton = document.querySelector('#unlockButton')
    if (unlockButton && !unlockButton.disabled) {
      unlockButton.addEventListener('click', () => unlockCurrent(data.resource))
    }
  } catch {
    dialogContent.innerHTML = '<div class="empty-state"><h3>资源详情暂时不可用</h3><p>关闭后再试一次。</p></div>'
  }
}

async function unlockCurrent(resource) {
  const button = document.querySelector('#unlockButton')
  if (!button) return
  button.disabled = true
  button.textContent = '正在解锁…'
  try {
    const response = await fetch(`/api/resources/${encodeURIComponent(resource.slug)}/unlock`, { method: 'POST' })
    const data = await response.json()
    if (!response.ok) {
      if (data.error === 'INSUFFICIENT_BALANCE') throw new Error(`还差 ${data.need} 燃币`)
      if (data.error === 'RESOURCE_NOT_READY') throw new Error('文件尚未导入，没有扣除燃币')
      throw new Error('解锁失败，请稍后再试')
    }
    showToast(data.alreadyUnlocked ? '这项资源已经解锁' : '解锁成功，之后打开不再扣币')
    await Promise.all([loadMe(), openResource(resource.slug, false)])
  } catch (error) {
    showToast(error.message || '解锁失败')
    button.disabled = false
    button.textContent = `使用 ${resource.costPoints} 燃币解锁`
  }
}

function closeDialog(useHistory = true) {
  document.querySelector('#courseVideo')?.pause()
  if (dialog.open) dialog.close()
  document.body.classList.remove('dialog-open')
  state.activeSlug = null
  if (useHistory && location.pathname.startsWith('/resource/')) history.pushState({}, '', '/')
}

let searchTimer
dialogContent.addEventListener('click', (event) => {
  const button = event.target.closest('[data-play-video]')
  if (!button) return
  const player = document.querySelector('#coursePlayer')
  const video = document.querySelector('#courseVideo')
  if (!player || !video) return
  document.querySelector('#courseTitle').textContent = button.dataset.videoTitle
  player.hidden = false
  video.src = button.dataset.playVideo
  video.play().catch(() => showToast('点击播放器继续播放，或下载到本地观看'))
  player.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})
searchInput.addEventListener('input', () => {
  state.search = searchInput.value
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCatalog(), 200)
})
loadMore.addEventListener('click', () => loadCatalog({ append: true }))
document.querySelector('#featuredOnly').addEventListener('click', (event) => {
  state.featuredOnly = !state.featuredOnly
  event.currentTarget.firstChild.textContent = state.featuredOnly ? '显示全部 ' : '只看精选 '
  loadCatalog()
})
document.querySelector('#dialogClose').addEventListener('click', () => closeDialog())
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog() })
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog() })
document.querySelector('#balanceButton').addEventListener('click', () => {
  showToast(state.me ? `${state.me.isGuest ? '游客余额' : state.me.name}：${state.me.balance} 燃币` : '燃币信息暂不可用')
})
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchInput.focus(); location.hash = 'resources' }
})
window.addEventListener('popstate', () => {
  const match = location.pathname.match(/^\/resource\/([^/]+)\/?$/)
  if (match) openResource(decodeURIComponent(match[1]), false)
  else closeDialog(false)
})

Promise.all([loadCatalog(), loadMe()]).then(() => {
  const match = location.pathname.match(/^\/resource\/([^/]+)\/?$/)
  if (match) openResource(decodeURIComponent(match[1]), false)
})
