/** GitHub 风格 identicon 色板（开源社区常用配色） */
const IDENTICON_COLORS = [
  '#b60205',
  '#d93f0b',
  '#fbca04',
  '#0e8a16',
  '#006b75',
  '#1d76db',
  '#0052cc',
  '#5319e7',
  '#e99695',
  '#f9d0c4',
  '#fef2c0',
  '#c2e0c6',
  '#bfdadc',
  '#bfd4f2',
  '#d4c5f9',
]

const IDENTICON_BG = '#ebedf0'
const IDENTICON_DARK_BG = '#21262d'

function hashString(input) {
  let hash = 5381
  const str = String(input || 'guest')
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

export function getUserAvatarSeed(user) {
  if (!user) return 'guest'
  return String(user.login || user.email || user.id || user.name || 'guest')
}

export function getUserAvatarInitials(user) {
  const raw = String(user?.login || user?.email || user?.name || user?.id || '?').trim()
  if (!raw) return '?'
  const cleaned = raw.replace(/^github:/, '')
  if (cleaned.includes('@')) {
    const local = cleaned.split('@')[0]
    return local.slice(0, 2).toUpperCase()
  }
  return cleaned.slice(0, 2).toUpperCase()
}

function buildIdenticonCells(hash) {
  const cells = []
  let bit = 0
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      if ((hash >> bit) & 1) {
        cells.push([x, y])
        if (x !== 4 - x) cells.push([4 - x, y])
      }
      bit += 1
    }
  }
  return cells
}

/**
 * 生成 GitHub 风格 5×5 对称 identicon SVG。
 * @param {string} seed
 * @param {{ dark?: boolean }} [options]
 */
export function buildUserAvatarSvg(seed, options = {}) {
  const hash = hashString(seed)
  const color = IDENTICON_COLORS[hash % IDENTICON_COLORS.length]
  const bg = options.dark ? IDENTICON_DARK_BG : IDENTICON_BG
  const cells = buildIdenticonCells(hash)
  const cellSize = 20
  const size = 5 * cellSize

  const rects = cells
    .map(
      ([x, y]) =>
        `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2" ry="2"/>`,
    )
    .join('')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">`,
    `<rect width="${size}" height="${size}" fill="${bg}"/>`,
    rects,
    '</svg>',
  ].join('')
}

export function getUserAvatarDataUri(seed, options = {}) {
  return `data:image/svg+xml,${encodeURIComponent(buildUserAvatarSvg(seed, options))}`
}

export function getUserAvatarDataUriForUser(user, options = {}) {
  return getUserAvatarDataUri(getUserAvatarSeed(user), options)
}
