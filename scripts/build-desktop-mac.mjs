import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'

if (process.platform !== 'darwin') throw new Error('macOS installers must be built on macOS')
const root = process.cwd()
const config = JSON.parse(readFileSync('electron-builder.desktop.json', 'utf8'))
const cache = path.join(homedir(), 'Library/Caches/electron')
const args = ['--projectDir', 'desktop', '--config', '../electron-builder.desktop.json', '--mac', '--dir', '--x64', '--arm64', '--publish=never']
if (['x64', 'arm64'].every(arch => existsSync(path.join(cache, `electron-v${config.electronVersion}-darwin-${arch}.zip`)))) {
  args.push(`--config.electronDist=${cache}`)
}
execFileSync(path.join(root, 'node_modules/.bin/electron-builder'), args, { stdio: 'inherit' })
for (const arch of ['x64', 'arm64']) {
  const stage = mkdtempSync(path.join(tmpdir(), '2aran-dmg-build-'))
  try {
    execFileSync('ditto', [path.join(root, 'desktop-dist', arch === 'arm64' ? 'mac-arm64' : 'mac', '2aran Desktop.app'), path.join(stage, '2aran Desktop.app')])
    symlinkSync('/Applications', path.join(stage, 'Applications'))
    const name = config.mac.artifactName.replace('${arch}', arch).replace('${ext}', 'dmg')
    execFileSync('hdiutil', ['create', '-volname', `2aran Desktop Test ${arch}`, '-srcfolder', stage, '-ov', '-format', 'UDZO', path.join(root, 'desktop-dist', name)], { stdio: 'inherit' })
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}
execFileSync(process.execPath, ['scripts/verify-desktop-installers.mjs'], { stdio: 'inherit' })
