/**
 * Worker 运行时环境变量读取。
 * 单独成文件，让 lib/pay/gateways 与 lib/pay/rules 保持无框架依赖，能在 node 单测里直接跑。
 */
import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

export function workerEnv() {
  try {
    return getOptionalRequestContext()?.env || {}
  } catch {
    return {}
  }
}
