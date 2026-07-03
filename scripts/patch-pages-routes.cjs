const fs = require('fs')
const path = require('path')

const routesPath = path.join(process.cwd(), '.vercel/output/static/_routes.json')
const adsTxtRoute = '/ads.txt'

if (!fs.existsSync(routesPath)) {
  throw new Error(`Cloudflare Pages routes file not found: ${routesPath}`)
}

const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))
const exclude = Array.isArray(routes.exclude) ? routes.exclude : []

if (!exclude.includes(adsTxtRoute)) {
  routes.exclude = [...exclude, adsTxtRoute]
  fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`)
  console.log(`[patch-pages-routes] excluded ${adsTxtRoute} from Worker routing`)
} else {
  console.log(`[patch-pages-routes] ${adsTxtRoute} already excluded`)
}
