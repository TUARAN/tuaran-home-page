import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../../app/(site)/components/HomeMasonry.jsx', import.meta.url), 'utf8')

test('首页瀑布流同时观察卡片外框，子内容后出现时会重新计算行跨度', () => {
  assert.match(source, /observer\.observe\(item\)\s*\n\s*if \(item\.firstElementChild\) observer\.observe\(item\.firstElementChild\)/)
})

test('首页瀑布流行跨度取内容与外框的较大高度，避免下一张卡片压住上一张', () => {
  assert.match(source, /Math\.max\(content\.getBoundingClientRect\(\)\.height, item\.getBoundingClientRect\(\)\.height\)/)
})

test('首页瀑布流在首次绘制前用内联脚本切到 Grid，避免先排多栏再跳成 Grid 的闪烁', () => {
  assert.match(source, /const MASONRY_PRE_PAINT_SCRIPT = `try\{\(\$\{measureMasonryGrid\.toString\(\)\}\)\(document\.currentScript/)
  assert.match(source, /<script dangerouslySetInnerHTML=\{\{ __html: MASONRY_PRE_PAINT_SCRIPT \}\} \/>/)
  assert.match(source, /className="home-main-grid" suppressHydrationWarning/)
})

test('瀑布流测量函数先标记 Grid 就绪再量高度，且不引用模块内其他变量', async () => {
  const start = source.indexOf('function measureMasonryGrid(grid) {')
  const end = source.indexOf('\n}\n', start)
  const body = source.slice(start, end + 2)
  assert.ok(body.indexOf("grid.dataset.masonryReady = 'true'") < body.indexOf('getComputedStyle(grid)'))
  const measure = new Function(`return (${body})`)()
  const item = (height) => ({
    classList: { contains: (name) => name === 'home-masonry-item' },
    firstElementChild: { getBoundingClientRect: () => ({ height }) },
    getClientRects: () => [1],
    getBoundingClientRect: () => ({ height }),
    style: {},
  })
  const items = [item(100), item(8)]
  const grid = { dataset: {}, children: items }
  globalThis.getComputedStyle = () => ({ gridAutoRows: '8px', rowGap: '16px' })
  measure(grid)
  assert.equal(grid.dataset.masonryReady, 'true')
  assert.equal(items[0].style.gridRowEnd, 'span 5')
  assert.equal(items[1].style.gridRowEnd, 'span 1')
})
