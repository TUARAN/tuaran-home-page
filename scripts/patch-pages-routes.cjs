const fs = require('fs')
const path = require('path')

async function main() {
  const routesPath = path.join(process.cwd(), '.vercel/output/static/_routes.json')
  if (!fs.existsSync(routesPath)) throw new Error(`Cloudflare Pages routes file not found: ${routesPath}`)
  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))
  const exclude = new Set([...(routes.exclude || []), '/ads.txt'])
  const configPath = path.join(process.cwd(), 'data/media-redirects.json')
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const { mediaRouteExclusions } = await import('./lib/content-media-migration.mjs')
    for (const entry of config.entries || []) {
      if (!/^\/(feed|images|videos|audio)\//.test(entry.oldUrl) || !entry.url.startsWith('https://')) throw new Error('Invalid media redirect configuration')
    }
    for (const pattern of mediaRouteExclusions(config.entries || [])) exclude.add(pattern)
  }
  routes.exclude = [...exclude]
  if ((routes.include || []).length + routes.exclude.length > 100) throw new Error('Pages routing exceeds 100 rules; split media migration or consolidate safe static namespaces')
  fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`)
  console.log(`[patch-pages-routes] ${routes.exclude.length} exclusions; media redirects bypass Functions`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
