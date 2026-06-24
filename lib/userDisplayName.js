/**
 * 用户 id → 趣味可读昵称的确定性映射。
 *
 * 借鉴常见开源项目的随机代号方案：
 *  - Docker：形容词 + 名人姓（nostalgic_einstein）
 *  - Gfycat / 各类房间号：形容词 + 动物（HappyPurpleOtter）
 *  - Heroku：形容词-名词-数字（floating-forest-1234）
 *
 * 这里取「形容词 + 动物 + 短哈希」：纯函数、确定性——同一个 user_id 永远映射到同一个昵称，
 * 既好辨识（看一眼就知道是谁、是不是同一个人），又不暴露完整 id。无任何 IO，可在前后端复用。
 *
 *   guest:6875dda3-...      → 🦊 狡黠的狐狸 · 游客 6875dd
 *   github:25968749         → 🐼 沉稳的熊猫 · GitHub 259687
 */

// 32 个形容词 × 32 个动物 = 1024 种基础组合，再叠 6 位短哈希做区分
const ADJECTIVES = [
  '机智', '沉思', '暴躁', '慵懒', '优雅', '神秘', '闪亮', '倔强',
  '温柔', '狡黠', '勇敢', '迷糊', '高冷', '热血', '佛系', '腹黑',
  '元气', '呆萌', '潇洒', '傲娇', '憨厚', '灵动', '犀利', '淡定',
  '飘逸', '炽热', '清醒', '贪睡', '好奇', '执着', '飒爽', '沉稳',
]

const ANIMALS = [
  ['🦫', '水豚'], ['🦊', '狐狸'], ['🐼', '熊猫'], ['🦦', '水獭'],
  ['🐙', '章鱼'], ['🦉', '猫头鹰'], ['🦔', '刺猬'], ['🐈', '狸花猫'],
  ['🦝', '浣熊'], ['🐳', '鲸鱼'], ['🦭', '海豹'], ['🐧', '企鹅'],
  ['🦡', '獾'], ['🐢', '乌龟'], ['🦥', '树懒'], ['🐿️', '松鼠'],
  ['🦌', '麋鹿'], ['🐺', '狼'], ['🦅', '鹰'], ['🐬', '海豚'],
  ['🦜', '鹦鹉'], ['🐉', '锦鲤'], ['🦎', '壁虎'], ['🐅', '老虎'],
  ['🦙', '羊驼'], ['🐊', '鳄鱼'], ['🦇', '蝙蝠'], ['🐝', '蜜蜂'],
  ['🦚', '孔雀'], ['🐌', '蜗牛'], ['🦩', '火烈鸟'], ['🐇', '兔子'],
]

const PROVIDER_LABELS = {
  guest: '游客',
  github: 'GitHub',
  google: 'Google',
  email: '邮箱',
  user: '用户',
}

/** FNV-1a 32 位哈希：确定性、分布均匀、无依赖 */
function hash32(str) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** 把任意种子串映射成 { emoji, animal, adjective, name } */
export function funNameForSeed(seed) {
  const h = hash32(String(seed || ''))
  const adjective = ADJECTIVES[h % ADJECTIVES.length]
  const [emoji, animal] = ANIMALS[Math.floor(h / ADJECTIVES.length) % ANIMALS.length]
  return { emoji, animal, adjective, name: `${adjective}的${animal}` }
}

/**
 * user_id（形如 guest:<uuid> / github:<id> / google:<sub> / email:<addr>）→ 展示信息。
 * @returns {{ provider, providerLabel, emoji, name, short, full }}
 */
export function displayNameForUserId(userId) {
  const full = String(userId || '').trim()
  const sep = full.indexOf(':')
  const provider = sep >= 0 ? full.slice(0, sep) : 'user'
  const body = sep >= 0 ? full.slice(sep + 1) : full
  const { emoji, name } = funNameForSeed(full)
  const short = body.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '------'
  return {
    provider,
    providerLabel: PROVIDER_LABELS[provider] || provider,
    emoji,
    name,
    short,
    full,
  }
}
