import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = path.join(root, 'tools', 'x-reply-clipboard-extension')

const manifest = JSON.parse(await readFile(path.join(extensionDir, 'manifest.json'), 'utf8'))
const version = String(manifest.version || '').trim()
if (!/^\d+\.\d+\.\d+$/u.test(version)) {
  console.error(`manifest.version 必须是三段数字（Chrome 不接受别的写法）：${version || '(空)'}`)
  process.exit(1)
}

const readme = await readFile(path.join(extensionDir, 'README.md'), 'utf8')
const versionTest = await readFile(path.join(root, 'tests', 'extensions', 'x-agent-v5.test.mjs'), 'utf8')
const escapedVersion = version.replaceAll('.', '\\.')

// 版本号散落在几处，这里按 VERSIONING.md 的要求核对：manifest 是唯一版本号，
// README 要写「当前本地源码」并在下面留一条同版本记录，测试里的断言也不能落后。
const checks = [
  ['README「当前本地源码为」行', readme.includes(`当前本地源码为 v${version}。`)],
  ['README 同版本记录条目', new RegExp(`v${escapedVersion}（\\d{4}-\\d{2}-\\d{2}，本地测试）`, 'u').test(readme)],
  ['x-agent-v5.test.mjs 的 manifest 版本断言', versionTest.includes(`assert.equal(manifest.version, '${version}')`)],
]

const failures = checks.filter(([, ok]) => !ok)
if (failures.length) {
  console.error(`X 大互动智能体版本不一致（manifest 为 v${version}）：`)
  for (const [name] of failures) console.error(`- ${name} 没跟上`)
  console.error('按 VERSIONING.md 补齐后再提交。')
  process.exit(1)
}

console.log(`X 大互动智能体版本一致：v${version}`)
