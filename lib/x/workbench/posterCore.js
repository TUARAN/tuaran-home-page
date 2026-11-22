// 蓝V海报：把一条推文画成 SVG。纯字符串生成，浏览器端再转 PNG 下载。
// 不加载外部头像（避免跨域污染画布），用首字母圆标代替。
export const POSTER_THEMES = Object.freeze({
  light: { bg: '#F5F5F4', card: '#FFFFFF', ink: '#111111', sub: '#6B6B66', accent: '#1677FF' },
  dark: { bg: '#0B0B0C', card: '#161617', ink: '#F5F5F4', sub: '#9A9A94', accent: '#4C9AFF' },
  blue: { bg: '#1677FF', card: '#FFFFFF', ink: '#0B1B33', sub: '#5B6B80', accent: '#1677FF' },
})

export function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function unitWidth(ch) {
  return /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1
}

// 按显示宽度（中文 2、西文 1）折行，保留原有换行。
export function wrapText(text, maxUnits) {
  const lines = []
  for (const para of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    let line = ''
    let width = 0
    for (const ch of Array.from(para)) {
      const w = unitWidth(ch)
      if (width + w > maxUnits) { lines.push(line); line = ''; width = 0 }
      line += ch
      width += w
    }
    lines.push(line)
  }
  return lines
}

export function buildPosterSvg({ name = '', handle = '', text = '', date = '', theme = 'light' } = {}) {
  const t = POSTER_THEMES[theme] || POSTER_THEMES.light
  const W = 1080
  const pad = 72
  const fontSize = 40
  const lineHeight = 64
  const lines = wrapText(String(text).slice(0, 600), 36)
  const headerH = 150
  const bodyH = lines.length * lineHeight
  const cardH = headerH + bodyH + 150
  const H = cardH + 2 * 56
  const initial = escapeXml(Array.from(String(name || handle || '?'))[0] || '?')
  const body = lines.map((l, i) => `<text x="${pad + 40}" y="${56 + headerH + 44 + i * lineHeight}" font-size="${fontSize}" fill="${t.ink}">${escapeXml(l)}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,'PingFang SC','Microsoft YaHei',Arial,sans-serif">`
    + `<rect width="${W}" height="${H}" fill="${t.bg}"/>`
    + `<rect x="56" y="56" width="${W - 112}" height="${cardH}" rx="32" fill="${t.card}"/>`
    + `<circle cx="${pad + 40 + 36}" cy="${56 + 40 + 56}" r="36" fill="${t.accent}"/>`
    + `<text x="${pad + 40 + 36}" y="${56 + 40 + 56 + 14}" font-size="38" text-anchor="middle" fill="#FFFFFF" font-weight="700">${initial}</text>`
    + `<text x="${pad + 40 + 96}" y="${56 + 40 + 48}" font-size="38" font-weight="700" fill="${t.ink}">${escapeXml(name || handle)}</text>`
    + `<text x="${pad + 40 + 96}" y="${56 + 40 + 92}" font-size="30" fill="${t.sub}">@${escapeXml(handle)}</text>`
    + body
    + `<text x="${pad + 40}" y="${56 + cardH - 48}" font-size="28" fill="${t.sub}">${escapeXml(date)}</text>`
    + `<text x="${W - pad - 40}" y="${56 + cardH - 48}" font-size="28" text-anchor="end" fill="${t.accent}">x.2aran.com</text>`
    + `</svg>`
}

export function buildBoardSvg({ rows = [], title = '账号榜', metric = 'views', label = '曝光', date = '' } = {}) {
  const safeMetric = ['posts', 'replies', 'views', 'likes'].includes(metric) ? metric : 'views'
  const list = rows.slice(0, 10)
  const height = 240 + list.length * 72
  const body = list.map((r, i) => `<text x="48" y="${150 + i * 72}" font-size="24" fill="#1677ff">${i + 1}</text><text x="100" y="${150 + i * 72}" font-size="22" fill="#111">${escapeXml(String(r.display_name || '@' + r.handle).slice(0, 20))}</text><text x="750" y="${150 + i * 72}" text-anchor="end" font-size="22">${escapeXml(Number(r[safeMetric]) || 0)}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><rect width="800" height="${height}" fill="#f5f5f4"/><g font-family="Arial, sans-serif"><text x="48" y="56" font-size="32" font-weight="bold">${escapeXml(title)} · ${escapeXml(label)}</text><text x="48" y="92" font-size="16" fill="#666">${escapeXml(date)} · 北京时间 8 点为界</text>${body}<text x="48" y="${height - 42}" font-size="15" fill="#666">仅覆盖采集推文，指标随采集更新 · x.2aran.com</text></g></svg>`
}
