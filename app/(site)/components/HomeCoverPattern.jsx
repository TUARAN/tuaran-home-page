import { homeCoverPattern } from '../../../lib/home/homeCoverPattern'

// 类名必须逐字写出：构建只保留源码里出现过的选择器，拼接出来的会被丢掉。
const TONE_CLASS = {
  accent: 'home-cover-tone-accent',
  blue: 'home-cover-tone-blue',
  green: 'home-cover-tone-green',
  stone: 'home-cover-tone-stone',
}

const INK = 'var(--home-cover-ink)'
const SOFT = 'var(--home-cover-soft)'
const VIEW_WIDTH = 136
const VIEW_HEIGHT = 96

function grid(step, offsetX = 0, offsetY = 0) {
  const points = []
  for (let y = offsetY; y <= VIEW_HEIGHT + step; y += step) {
    for (let x = offsetX; x <= VIEW_WIDTH + step; x += step) points.push([x, y])
  }
  return points
}

const DOTS = grid(12)
const STRIPES = Array.from({ length: 22 }, (_, index) => -40 + index * 12)
const CONTOURS = [12, 24, 36, 48, 60]
const RAYS = Array.from({ length: 28 }, (_, index) => (index * Math.PI * 2) / 28)
const CHEVRON_ROWS = [10, 26, 42, 58, 74, 90]
const CHEVRON_POINTS = Array.from({ length: 15 }, (_, index) => index * 12)

// 每个图案画在 136×96 的画布里，超出部分由外层 svg 裁掉。
const PATTERNS = [
  // 同心弧
  () => (
    <g fill="none" stroke={INK} strokeWidth="5">
      {[14, 30, 46, 62, 78].map((radius) => (
        <circle key={radius} cx="6" cy="94" r={radius} />
      ))}
    </g>
  ),
  // 点阵
  () => (
    <g fill={SOFT}>
      {DOTS.map(([x, y]) => (
        <circle key={`${x}:${y}`} cx={x} cy={y} r="2.2" />
      ))}
      <circle cx="88" cy="48" r="15" fill={INK} />
    </g>
  ),
  // 斜纹
  () => (
    <g stroke={INK} strokeWidth="4" transform="rotate(-28 68 48)">
      {STRIPES.map((y) => (
        <line key={y} x1="-60" y1={y} x2="200" y2={y} />
      ))}
    </g>
  ),
  // 叠圆
  () => (
    <g>
      <circle cx="52" cy="30" r="44" fill={SOFT} />
      <circle cx="104" cy="72" r="34" fill={INK} />
      <circle cx="30" cy="84" r="14" fill={INK} />
    </g>
  ),
  // 等高线
  () => (
    <g fill="none" stroke={INK} strokeWidth="2">
      {CONTOURS.map((radius) => (
        <ellipse key={radius} cx="68" cy="48" rx={radius} ry={radius * 0.58} transform="rotate(-14 68 48)" />
      ))}
    </g>
  ),
  // 切角色块
  () => (
    <g>
      <polygon points="0,96 136,10 136,96" fill={SOFT} />
      <polygon points="0,96 62,58 96,96" fill={INK} />
    </g>
  ),
  // 错位方块
  () => (
    <g>
      <rect x="12" y="8" width="34" height="34" rx="5" fill={SOFT} />
      <rect x="52" y="28" width="34" height="34" rx="5" fill={INK} />
      <rect x="92" y="8" width="34" height="34" rx="5" fill={SOFT} />
      <rect x="12" y="54" width="34" height="34" rx="5" fill={INK} />
      <rect x="92" y="54" width="34" height="34" rx="5" fill={SOFT} />
    </g>
  ),
  // 波浪线
  () => (
    <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
      {[12, 30, 48, 66, 84].map((y) => (
        <path
          key={y}
          d={`M-8 ${y} q 17 -12 34 0 t 34 0 t 34 0 t 34 0 t 34 0`}
        />
      ))}
    </g>
  ),
  // 放射线
  () => (
    <g>
      <g stroke={SOFT} strokeWidth="3" strokeLinecap="round">
        {RAYS.map((angle) => (
          <line
            key={angle}
            x1={92 + Math.cos(angle) * 18}
            y1={48 + Math.sin(angle) * 18}
            x2={92 + Math.cos(angle) * 70}
            y2={48 + Math.sin(angle) * 70}
          />
        ))}
      </g>
      <circle cx="92" cy="48" r="11" fill={INK} />
    </g>
  ),
  // 折线
  () => (
    <g fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round">
      {CHEVRON_ROWS.map((y) => (
        <polyline
          key={y}
          points={CHEVRON_POINTS.map((x, index) => `${x},${y + (index % 2 === 0 ? 0 : 10)}`).join(' ')}
        />
      ))}
    </g>
  ),
]

/** 图案封面。装饰用，对读屏隐藏。 */
export default function HomeCoverPattern({ id, section }) {
  const { pattern, tone, flip } = homeCoverPattern(id, section)
  const Draw = PATTERNS[pattern] || PATTERNS[0]

  return (
    <svg
      className={`home-cover-pattern ${TONE_CLASS[tone] || TONE_CLASS.accent}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="var(--home-cover-bg)" />
      {/* 镜像画在内部 group 上，不占用外层 transform，行内悬停缩放照常生效。 */}
      <g transform={flip ? `translate(${VIEW_WIDTH} 0) scale(-1 1)` : undefined}>
        <Draw />
      </g>
    </svg>
  )
}
