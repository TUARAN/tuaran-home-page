// Legacy styles cover three themes; friendship packs provide one image per publishing slot.
const THEMES = Object.freeze({ morning: '早安', noon: '午安', friends: '交个朋友' })
export const X_MEME_SLOT_THEMES = Object.freeze({
  morning: 'morning',
  noon: 'noon',
  community_friends: 'friends',
  community_learning: 'friends',
  community_growth: 'friends',
})

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

function friendshipGroup(id, label, assets) {
  return Object.freeze({
    id,
    label,
    assets: Object.freeze(Object.entries(assets).map(([slot, asset]) => Object.freeze({
      id: `${id}-${slot}`,
      groupId: id,
      slot,
      theme: X_MEME_SLOT_THEMES[slot],
      label: `${label} · ${asset.label}`,
      path: `/assets/stickers/friendship-pack-01/${asset.file}`,
      thumb: `/assets/stickers/friendship-pack-01/thumbs/${asset.file.replace(/\.png$/i, '.jpg')}`,
    }))),
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
  friendshipGroup('friendship-a', '友谊动物 A', {
    morning: { label: '早安呀朋友', file: '06-corgi-good-morning.png' },
    noon: { label: '给你抱抱', file: '13-otter-hug.png' },
    community_friends: { label: '认识一下', file: '02-orange-cat-meet.png' },
    community_learning: { label: '来做蓝朋友', file: '05-red-panda-blue-friend.png' },
    community_growth: { label: '互关一下呀', file: '04-rabbit-follow.png' },
  }),
  friendshipGroup('friendship-b', '友谊动物 B', {
    morning: { label: '嗨！你好呀', file: '01-shiba-hello.png' },
    noon: { label: '为友谊点赞', file: '16-hedgehog-friendship-like.png' },
    community_friends: { label: '交个朋友吧', file: '03-blue-penguin-friends.png' },
    community_learning: { label: '冒个泡吧', file: '10-frog-say-something.png' },
    community_growth: { label: '常联系哦', file: '07-seal-keep-in-touch.png' },
  }),
  friendshipGroup('friendship-c', '友谊动物 C', {
    morning: { label: '新朋友你好', file: '11-elephant-new-friend.png' },
    noon: { label: '谢谢你朋友', file: '19-deer-thank-you.png' },
    community_friends: { label: '好友申请请通过', file: '18-bee-friend-request.png' },
    community_learning: { label: '互关成功', file: '12-alpaca-follow-success.png' },
    community_growth: { label: '友谊长存', file: '08-fox-friendship.png' },
  }),
  friendshipGroup('friendship-d', '友谊动物 D', {
    morning: { label: '朋友想你啦', file: '17-polar-bear-miss-you.png' },
    noon: { label: '友谊一直在线', file: '20-cloud-friendship-online.png' },
    community_friends: { label: '以后多关照', file: '15-dinosaur-take-care.png' },
    community_learning: { label: '在吗在吗', file: '09-sloth-are-you-there.png' },
    community_growth: { label: '晚安好朋友', file: '14-owl-good-night.png' },
  }),
])
export const X_MEME_ASSETS = Object.freeze(X_MEME_GROUPS.flatMap((item) => item.assets))
export const X_MEME_VERSION = 'styles-v3'

export function xMemeThumbPath(imagePath) {
  const asset = X_MEME_ASSETS.find((item) => item.path === imagePath)
  if (asset?.thumb) return asset.thumb
  const file = String(imagePath || '').split('/').pop()?.replace(/\.png$/i, '')
  return file ? `/images/x-memes/thumbs/${file}.jpg` : ''
}

const SLOT_ORDER = Object.keys(X_MEME_SLOT_THEMES)

// Stable per Shanghai date + slot. Five distinct styles appear across the five
// daily image opportunities; each slot cycles through every style in nine days.
export function pickXMemeAsset({ slot, date } = {}) {
  const theme = X_MEME_SLOT_THEMES[slot]
  if (!theme) return null
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? Date.parse(`${date}T00:00:00Z`) : NaN
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new Error('X_MEME_INVALID_DATE')
  }
  const day = Math.floor(timestamp / 86_400_000)
  const index = ((day + SLOT_ORDER.indexOf(slot)) % X_MEME_GROUPS.length + X_MEME_GROUPS.length) % X_MEME_GROUPS.length
  const assets = X_MEME_GROUPS[index].assets
  return assets.find((asset) => asset.slot === slot) || assets.find((asset) => asset.theme === theme)
}
