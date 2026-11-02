const { execFileSync } = require('node:child_process')
const path = require('node:path')

// Reject broken bundle signatures before producing a macOS installer.
module.exports = async function verifyDesktopApp(context) {
  if (context.electronPlatformName !== 'darwin') return
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
  })
}
