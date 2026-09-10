// Build-time only: load the repository's extensionless ESM data modules with Node.
import fs from 'node:fs'
const root = new URL('../', import.meta.url).href
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL?.startsWith(root)) {
    const candidate = new URL(specifier, context.parentURL)
    if (!/\.[a-z0-9]+$/i.test(candidate.pathname) && fs.existsSync(new URL(`${candidate.href}.js`))) {
      return nextResolve(`${candidate.href}.js`, context)
    }
  }
  return nextResolve(specifier, context)
}
export async function load(url, context, nextLoad) {
  if (url.startsWith(root) && !url.includes('/node_modules/')) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }
    if (url.endsWith('.js') && /\/(lib|app)\//.test(url)) return { format: 'module', source: fs.readFileSync(new URL(url), 'utf8'), shortCircuit: true }
  }
  return nextLoad(url, context)
}
