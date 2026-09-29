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

function friendshipGroup(id, label, assets, pack = 'friendship-pack-01') {
  return Object.freeze({
    id,
    label,
    assets: Object.freeze(Object.entries(assets).map(([slot, asset]) => Object.freeze({
      id: `${id}-${slot}`,
      groupId: id,
      slot,
      theme: X_MEME_SLOT_THEMES[slot],
      label: `${label} · ${asset.label}`,
      path: `/assets/stickers/${pack}/${asset.file}`,
      thumb: `/assets/stickers/${pack}/thumbs/${asset.file.replace(/\.png$/i, '.jpg')}`,
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
  friendshipGroup('friendship-v2-watercolor', '水彩手账', {
    morning: { label: '拉开窗帘说早安', file: 'watercolor-morning.png' },
    noon: { label: '分你一半午餐', file: 'watercolor-noon.png' },
    community_friends: { label: '探头认识一下', file: 'watercolor-friends.png' },
    community_learning: { label: '交换今日新发现', file: 'watercolor-learning.png' },
    community_growth: { label: '裹着毯子来串门', file: 'watercolor-evening.png' },
  }, 'friendship-pack-02'),
  friendshipGroup('friendship-v2-pixel', '像素游戏', {
    morning: { label: '像素早安冲刺', file: 'pixel-morning.png' },
    noon: { label: '午餐盒分你一份', file: 'pixel-noon.png' },
    community_friends: { label: '冒个泡认识一下', file: 'pixel-friends.png' },
    community_learning: { label: '交换有趣卡片', file: 'pixel-learning.png' },
    community_growth: { label: '下班后慢慢聊', file: 'pixel-evening.png' },
  }, 'friendship-pack-02'),
  friendshipGroup('friendship-v2-clay', '黏土定格', {
    morning: { label: '水豚伸懒腰', file: 'clay-morning.png' },
    noon: { label: '揭开午餐盖子', file: 'clay-noon.png' },
    community_friends: { label: '给新朋友留把椅子', file: 'clay-friends.png' },
    community_learning: { label: '递给你一个点子', file: 'clay-learning.png' },
    community_growth: { label: '摘下眼镜收工', file: 'clay-evening.png' },
  }, 'friendship-pack-02'),
  friendshipGroup('friendship-v2-pencil', '彩铅涂鸦', {
    morning: { label: '穿着袜子挥早安', file: 'pencil-morning.png' },
    noon: { label: '饭团分你一半', file: 'pencil-noon.png' },
    community_friends: { label: '多滚来一只杯子', file: 'pencil-friends.png' },
    community_learning: { label: '翻开兴趣剪贴簿', file: 'pencil-learning.png' },
    community_growth: { label: '关掉电脑说晚安', file: 'pencil-evening.png' },
  }, 'friendship-pack-02'),
  friendshipGroup('friendship-v2-papercut', '剪纸拼贴', {
    morning: { label: '举着吐司来早安', file: 'papercut-morning.png' },
    noon: { label: '水饺分你一个', file: 'papercut-noon.png' },
    community_friends: { label: '送新朋友一朵花', file: 'papercut-friends.png' },
    community_learning: { label: '交换彩色点子卡', file: 'papercut-learning.png' },
    community_growth: { label: '盖好毯子来挥手', file: 'papercut-evening.png' },
  }, 'friendship-pack-02'),
  friendshipGroup('friendship-v2-retro', '复古网点', {
    morning: { label: '敲响早餐铃', file: 'retro-morning.png' },
    noon: { label: '请你吃一口面', file: 'retro-noon.png' },
    community_friends: { label: '慢慢拆开新问候', file: 'retro-friends.png' },
    community_learning: { label: '一起抛几个新点子', file: 'retro-learning.png' },
    community_growth: { label: '啪嗒关灯收工', file: 'retro-evening.png' },
  }, 'friendship-pack-02'),
])
export const X_MEME_ASSETS = Object.freeze(X_MEME_GROUPS.flatMap((item) => item.assets))
export const X_ACTIVE_MEME_GROUPS = Object.freeze(X_MEME_GROUPS.filter((group) => group.id.startsWith('friendship-v2-')))
export const X_MEME_VERSION = 'styles-v4'

export function xMemeThumbPath(imagePath) {
  const asset = X_MEME_ASSETS.find((item) => item.path === imagePath)
  if (asset?.thumb) return asset.thumb
  const file = String(imagePath || '').split('/').pop()?.replace(/\.png$/i, '')
  return file ? `/images/x-memes/thumbs/${file}.jpg` : ''
}

const SLOT_ORDER = Object.keys(X_MEME_SLOT_THEMES)

// Stable per Shanghai date + slot. The new 30-image pack supplies five distinct
// styles each day and cycles every slot through all six styles in six days.
export function pickXMemeAsset({ slot, date } = {}) {
  const theme = X_MEME_SLOT_THEMES[slot]
  if (!theme) return null
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? Date.parse(`${date}T00:00:00Z`) : NaN
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new Error('X_MEME_INVALID_DATE')
  }
  const day = Math.floor(timestamp / 86_400_000)
  const index = ((day + SLOT_ORDER.indexOf(slot)) % X_ACTIVE_MEME_GROUPS.length + X_ACTIVE_MEME_GROUPS.length) % X_ACTIVE_MEME_GROUPS.length
  const assets = X_ACTIVE_MEME_GROUPS[index].assets
  return assets.find((asset) => asset.slot === slot) || assets.find((asset) => asset.theme === theme)
}
