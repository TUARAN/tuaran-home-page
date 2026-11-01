import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const version = String(process.argv[2] || '').trim()
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Usage: node scripts/embed-x-reply-extension-package.mjs VERSION')

const fileName = `x-reply-clipboard-extension-v${version}.zip`
const input = path.join(root, 'output', fileName)
const output = path.join(root, 'lib', 'generated', 'xReplyExtensionPackage.js')
const bytes = await readFile(input)
const sha256 = createHash('sha256').update(bytes).digest('hex')
const metadata = { objectKey: `downloads/${fileName}`, fileName, contentType: 'application/zip', size: bytes.length, sha256 }
const source = '// Generated release metadata. Package bytes live in private R2, never in the Worker bundle.\n' +
  `export const X_REPLY_EXTENSION_PACKAGE = Object.freeze(${JSON.stringify(metadata, null, 2)})\n`
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, source)
console.log(`${path.relative(root, output)} metadata only; upload ${input} to private R2 object ${metadata.objectKey} before deploying`)
