import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateDailyTopDay } from './model.js'

// Node 目录扫描，供测试和 git 目录核对。Edge 不读文件系统，线上合并见 store.js。
const daysDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'days')

export function loadDailyTopDays(directory = daysDir) {
  const files = readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
  return files.map((name) => {
    const day = JSON.parse(readFileSync(path.join(directory, name), 'utf8'))
    return validateDailyTopDay(day, name)
  })
}
