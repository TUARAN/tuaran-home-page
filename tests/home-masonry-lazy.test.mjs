import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PLACEHOLDER_HEIGHT,
  PRELOAD_MARGIN,
  SSR_EAGER_COUNT,
  VIEWPORT_MARGIN,
  createEagerSet,
  mergeMounted,
  resolvePlaceholderClassName,
  resolveZone,
} from '../lib/home/homeMasonryLazy.mjs'

test('三区划分：视口内一律为加载区', () => {
  assert.equal(resolveZone({ inViewport: true, inPreload: false, mounted: false }), 'load')
  assert.equal(resolveZone({ inViewport: true, inPreload: true, mounted: true }), 'load')
})

test('三区划分：视口外但进入预加载区或已挂载为预加载区', () => {
  assert.equal(resolveZone({ inViewport: false, inPreload: true, mounted: false }), 'preload')
  assert.equal(resolveZone({ inViewport: false, inPreload: false, mounted: true }), 'preload')
})

test('三区划分：未挂载且远离视口为不用加载区', () => {
  assert.equal(resolveZone({ inViewport: false, inPreload: false, mounted: false }), 'idle')
})

test('首屏集合只包含前 N 个索引', () => {
  assert.deepEqual([...createEagerSet(3)], [0, 1, 2])
  assert.deepEqual([...createEagerSet(0)], [])
  assert.deepEqual([...createEagerSet(-1)], [])
})

test('激活索引合并幂等，重复激活不产生新集合', () => {
  const first = createEagerSet(2)
  const second = mergeMounted(first, [2, 3])
  assert.notEqual(second, first)
  assert.deepEqual([...second], [0, 1, 2, 3])
  assert.equal(mergeMounted(second, [2, 3]), second)
  assert.equal(mergeMounted(second, []), second)
  assert.equal(mergeMounted(second, [NaN, -2]), second)
})

test('占位继承原卡片类名，移动端隐藏规则不丢失', () => {
  assert.equal(
    resolvePlaceholderClassName('home-masonry-item home-side-stack hidden lg:block'),
    'home-masonry-item home-side-stack hidden lg:block',
  )
  assert.equal(resolvePlaceholderClassName('home-masonry-item'), 'home-masonry-item')
  assert.equal(resolvePlaceholderClassName(undefined), 'home-masonry-item')
  assert.equal(resolvePlaceholderClassName('hidden lg:block'), 'home-masonry-item hidden lg:block')
})

test('分区参数为合法的 rootMargin 写法，预加载区向下大于向上', () => {
  assert.equal(VIEWPORT_MARGIN, '0px')
  const parts = PRELOAD_MARGIN.split(/\s+/)
  assert.equal(parts.length, 4)
  assert.ok(parseInt(parts[0], 10) > 0)
  assert.ok(parseInt(parts[2], 10) > parseInt(parts[0], 10))
  assert.ok(parts.every((part) => /^\d+px$/.test(part)))
  assert.ok(SSR_EAGER_COUNT > 0 && Number.isInteger(SSR_EAGER_COUNT))
  assert.ok(PLACEHOLDER_HEIGHT > 0)
})
