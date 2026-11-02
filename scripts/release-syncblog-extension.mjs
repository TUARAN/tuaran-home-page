import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceIndex = process.argv.indexOf('--source')
const source = path.resolve(sourceIndex >= 0 ? process.argv[sourceIndex + 1] : path.join(root, '../md'))
execFileSync('pnpm', ['package:syncblog-plugin'], { cwd: source, stdio: 'inherit' })
const input = path.join(source, 'output/distribution-extension/ai-distribution-master.zip')
const inspection = JSON.parse(execFileSync('python3', ['-c', `import json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 names=z.namelist()
 assert 'manifest.json' in names, 'Manifest must be at ZIP root'
 assert not any(n.endswith(('community-secret.local','.env','.env.local')) for n in names), 'Credential files must not enter a base release'
 assert z.testzip() is None, 'Corrupt ZIP'
 m=json.loads(z.read('manifest.json'))
 print(json.dumps({'version':m['version']}))`, input], { encoding: 'utf8' }))
if (!/^\d+\.\d+\.\d+$/.test(inspection.version)) throw new Error('Invalid release version')
const bytes = await readFile(input)
const fileName = `ai-distribution-master-v${inspection.version}.zip`
await mkdir(path.join(root, 'output'), { recursive: true })
const artifact = path.join(root, 'output', fileName)
await copyFile(input, artifact)
const metadata = { version: inspection.version, objectKey: `downloads/${fileName}`, fileName, contentType: 'application/zip', size: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') }
if (!process.argv.includes('--prepare-only')) {
  execFileSync(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), 'r2', 'object', 'put', `tuaran-private-documents/${metadata.objectKey}`, '--file', artifact, '--remote', '--content-type', 'application/zip', '--cache-control', 'private, no-store'], { cwd: root, stdio: 'inherit' })
}
await writeFile(path.join(root, 'lib/generated/syncblogExtensionPackage.js'), `// Generated release metadata; package bytes live only in private R2.\nexport const SYNCBLOG_EXTENSION_PACKAGE = Object.freeze(${JSON.stringify(metadata, null, 2)})\n`)
console.log(`${process.argv.includes('--prepare-only') ? 'Prepared (not uploaded)' : 'Packaged and uploaded privately'}: ${fileName}; SHA-256 ${metadata.sha256}`)
