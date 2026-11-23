/**
 * 跨 isolate 的只读缓存，用来收敛「每次请求都整表扫一遍」的 D1 查询。
 *
 * 为什么不用模块内变量：Pages Functions 每个请求可能落到不同 isolate，
 * 模块级缓存只在单个 isolate 内有效，爬虫和高频轮询会把每个 isolate 各打一遍。
 * Cloudflare Cache API 按 colo 共享，同一分钟内的重复请求只查一次库。
 *
 * 约定：
 * - 只缓存读结果，不缓存异常；读抛错时原样抛出，调用方的降级逻辑不受影响。
 * - 值为 null / undefined 时不写入缓存，避免把「暂时读不到」固化 60 秒。
 * - 缓存不可用（本地 Node、单元测试、非请求上下文）时退回进程内 Map，
 *   行为与直读一致，只是少了跨实例共享。
 */

const CACHE_ORIGIN = 'https://2aran.com'
const MEMORY_LIMIT = 128
const memory = new Map()

function nowMs() {
  return Date.now()
}

function cacheStore() {
  try {
    return globalThis.caches?.default || null
  } catch {
    return null
  }
}

function cacheRequest(key) {
  return new Request(`${CACHE_ORIGIN}/__edge-cache/${encodeURIComponent(key)}`, { method: 'GET' })
}

function memoryRead(key) {
  const hit = memory.get(key)
  if (!hit) return undefined
  if (hit.expiresAt <= nowMs()) {
    memory.delete(key)
    return undefined
  }
  return hit.value
}

function memoryWrite(key, value, ttlSeconds) {
  if (memory.size >= MEMORY_LIMIT) {
    const oldest = memory.keys().next().value
    if (oldest !== undefined) memory.delete(oldest)
  }
  memory.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 })
}

/** 测试用：清空进程内缓存。 */
export function clearEdgeCacheMemory() {
  memory.clear()
}

/**
 * @template T
 * @param {string} key 稳定的缓存键，变更参数时要带上参数
 * @param {number} ttlSeconds 缓存时长
 * @param {() => Promise<T>} read 未命中时的取数函数
 * @returns {Promise<T>}
 */
export async function readThroughEdgeCache(key, ttlSeconds, read) {
  const ttl = Math.max(1, Math.trunc(Number(ttlSeconds) || 0))
  const cache = cacheStore()

  if (!cache) {
    const hit = memoryRead(key)
    if (hit !== undefined) return hit
  } else {
    try {
      const hit = await cache.match(cacheRequest(key))
      if (hit) {
        const body = await hit.json()
        if (body && Number(body.expiresAt) > nowMs()) return body.value
      }
    } catch {
      // 缓存读失败不影响取数。
    }
  }

  const value = await read()
  if (value === null || value === undefined) return value

  const payload = JSON.stringify({ expiresAt: nowMs() + ttl * 1000, value })
  if (cache) {
    try {
      await cache.put(cacheRequest(key), new Response(payload, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      }))
    } catch {
      // 写缓存失败只影响下一次复用，不影响本次返回。
    }
  } else {
    memoryWrite(key, value, ttl)
  }
  return value
}
