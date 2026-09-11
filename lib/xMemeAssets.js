// Each style has exactly one morning, one noon and one friendship image.
const THEMES = Object.freeze({ morning: '早安', noon: '午安', friends: '交个朋友' })

function group(id, label, paths) {
  return Object.freeze({
    id,
    label,
    assets: Object.freeze(Object.entries(THEMES).map(([theme, title]) => {
      const assetId = `${id}-${theme}`
      return Object.freeze({
        id: assetId,
        groupId: id,
        theme,
        label: `${label} · ${title}`,
        path: paths?.[theme] || `/images/x-memes/${id}/${theme}.png`,
        thumb: `/images/x-memes/thumbs/${assetId}.jpg`,
      })
    })),
  })
}

export const X_MEME_GROUPS = Object.freeze([
  group('doodle-cat', '涂鸦猫咪', {
    morning: '/images/x-memes/morning.png',
    noon: '/images/x-memes/noon.png',
    friends: '/images/x-memes/meme.png',
  }),
  group('pixel-frog', '像素青蛙'),
  group('clay-capybara', '黏土水豚'),
  group('crayon-duck', '蜡笔小鸭'),
  group('ink-panda', '黑白熊猫'),
])
export const X_MEME_ASSETS = Object.freeze(X_MEME_GROUPS.flatMap((item) => item.assets))
export const X_MEME_VERSION = 'styles-v2'

export function xMemeThumbPath(imagePath) {
  const asset = X_MEME_ASSETS.find((item) => item.path === imagePath)
  if (asset?.thumb) return asset.thumb
  const file = String(imagePath || '').split('/').pop()?.replace(/\.png$/i, '')
  return file ? `/images/x-memes/thumbs/${file}.jpg` : ''
}

export const X_MEME_SLOT_THEMES = Object.freeze({
  morning: 'morning',
  noon: 'noon',
  community_friends: 'friends',
  community_learning: 'friends',
  community_growth: 'friends',
})
const SLOT_ORDER = Object.keys(X_MEME_SLOT_THEMES)

// Stable per Shanghai date + slot. Five styles appear across the five daily
// image opportunities; each slot cycles through every style in five days.
export function pickXMemeAsset({ slot, date } = {}) {
  const theme = X_MEME_SLOT_THEMES[slot]
  if (!theme) return null
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? Date.parse(`${date}T00:00:00Z`) : NaN
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new Error('X_MEME_INVALID_DATE')
  }
  const day = Math.floor(timestamp / 86_400_000)
  const index = ((day + SLOT_ORDER.indexOf(slot)) % X_MEME_GROUPS.length + X_MEME_GROUPS.length) % X_MEME_GROUPS.length
  return X_MEME_GROUPS[index].assets.find((asset) => asset.theme === theme)
}
