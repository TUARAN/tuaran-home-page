// 首页瀑布流三区懒加载的分区参数与纯逻辑。
// 采用浏览器标准 IntersectionObserver + 社区通用的 triggerOnce 模式，不引入第三方依赖。

// 加载区：视口内，内容必须已挂载。
export const VIEWPORT_MARGIN = '0px'

// 预加载区：视口上方 200px、下方 600px（无限滚动常用的提前量）。
// 进入即挂载，避免滚动到跟前才出现空白；半径小于页面剩余高度，不用加载区才会真实存在。
export const PRELOAD_MARGIN = '200px 0px 600px 0px'

// 首屏直接服务端渲染的卡片数，保证 LCP 与静态 HTML 中的主要导航内容。
export const SSR_EAGER_COUNT = 6

// 占位卡片的估算高度；挂载后由 ResizeObserver 重新测量瀑布流行跨度修正。
export const PLACEHOLDER_HEIGHT = 360

export function createEagerSet(count) {
  const set = new Set()
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  for (let index = 0; index < total; index += 1) set.add(index)
  return set
}

export function resolveZone({ inViewport, inPreload, mounted }) {
  if (inViewport) return 'load'
  if (inPreload || mounted) return 'preload'
  return 'idle'
}

// 幂等合并：重复激活同一索引时返回原集合，避免依赖 mounted 的 effect 无限重建。
export function mergeMounted(prev, activated) {
  let changed = false
  const next = new Set(prev)
  for (const index of activated) {
    if (!Number.isInteger(index) || index < 0 || next.has(index)) continue
    next.add(index)
    changed = true
  }
  return changed ? next : prev
}

// 占位必须保留原卡片的响应式类名（如 hidden lg:block），否则移动端会露出本应隐藏的侧栏。
export function resolvePlaceholderClassName(className) {
  const base = typeof className === 'string' ? className.trim() : ''
  return base.includes('home-masonry-item') ? base : `home-masonry-item ${base}`.trim()
}
