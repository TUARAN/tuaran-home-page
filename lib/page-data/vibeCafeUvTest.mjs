// Local model of the public VibeCafé v1 identity lifecycle, reviewed 2026-09-04.
// No production product ID, credential, or network transport is used here.
export const VIBE_UV_TEST_MODES = [
  { id: 'retain-reload', label: '保留存储，每轮模拟重载', expected: '多轮事件应复用同一个 ID' },
  { id: 'clear-reload', label: '清除测试存储，每轮模拟重载', expected: '每轮应生成不同的 ID' },
  { id: 'clear-only', label: '仅清除测试存储，不重载', expected: '页面内存仍保留旧 ID，导航事件继续用它' },
]

export function createVibeUvExperiment({ storage, key, mode, makeId = () => crypto.randomUUID() }) {
  if (!key.startsWith('tuaran:uv-test:')) throw new Error('只允许操作独立测试键')
  if (!VIBE_UV_TEST_MODES.some(item => item.id === mode)) throw new Error('未知测试模式')
  let pageId = null
  let previousId = null
  let round = 0
  return {
    step() {
      const cleared = mode !== 'retain-reload'
      if (cleared) storage.removeItem(key)
      const reinitialized = pageId === null || mode !== 'clear-only'
      if (reinitialized) {
        pageId = storage.getItem(key)
        if (!pageId) {
          pageId = makeId()
          storage.setItem(key, pageId)
        }
      }
      const row = {
        round: ++round, visitorId: pageId,
        storedId: storage.getItem(key), cleared, reinitialized,
        changed: previousId === null ? null : previousId !== pageId,
        event: 'pageview', timestamp: Date.now(),
      }
      previousId = pageId
      return row
    },
    cleanup() { storage.removeItem(key) },
  }
}
