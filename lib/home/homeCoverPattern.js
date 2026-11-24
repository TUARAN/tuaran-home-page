/**
 * 列表缩略图图案：没有真实配图的条目，按 id 确定性套一张图案（/articles 内容目录在用）。
 *
 * 纯函数，Edge 与浏览器通用。结果只取决于 `section:id`，所以服务端渲染和
 * 客户端 hydration 看到的是同一张图，翻页、刷新也不会闪。
 */

/** 图案样式数量，必须与 HomeCoverPattern.jsx 里的 PATTERNS 一致。 */
export const HOME_COVER_PATTERN_COUNT = 10

/** 配色族。各族基色取自站点 token，随主题与深色模式变化。 */
export const HOME_COVER_TONES = ['accent', 'blue', 'green', 'stone']

/**
 * 各分区的主色：目录里扫一眼能分清文章 / 分析 / 资源 / 互动专题。
 * key 与内容分组（`getContentGroup`）对应。
 */
const SECTION_TONE = {
  column: 'accent',
  article: 'accent',
  practice: 'accent',
  research: 'blue',
  analysis: 'blue',
  resources: 'green',
  resource: 'green',
  interactive: 'stone',
}

// 约 60% 的条目用分区主色，其余从别的色族里选，避免整列一个颜色。
const HOME_TONE_SHARE = 3
const TONE_ROLL_MOD = 5

function hash(input) {
  let value = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i)
    value = Math.imul(value, 0x01000193) >>> 0
  }
  return value >>> 0
}

/**
 * @param {string} section 分区或内容分组：`column` | `article` | `analysis` | `resource` | `interactive` 等
 * @returns {{ pattern: number, tone: string, flip: boolean }}
 */
export function homeCoverPattern(id, section) {
  const value = hash(`${section}:${id}`)
  const home = SECTION_TONE[section] || 'accent'
  const others = HOME_COVER_TONES.filter((tone) => tone !== home)
  const tone = value % TONE_ROLL_MOD < HOME_TONE_SHARE
    ? home
    : others[Math.floor(value / TONE_ROLL_MOD) % others.length]
  return {
    pattern: Math.floor(value / 32) % HOME_COVER_PATTERN_COUNT,
    tone,
    flip: (value >>> 4) % 2 === 1,
  }
}
