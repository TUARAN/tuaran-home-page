import fs from 'fs'
import path from 'path'

const WHITEPAPER_FILES = {
  'workbuddy-opc-whitepaper': 'content/resources/workbuddy-opc-whitepaper.html',
  'workbuddy-smart-hardware-whitepaper': 'content/resources/workbuddy-smart-hardware-whitepaper.html',
}

export function loadWorkbuddyWhitepaper(slug) {
  const file = WHITEPAPER_FILES[slug]
  if (!file) throw new Error(`Unknown WorkBuddy whitepaper: ${slug}`)
  const html = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
  const toc = JSON.parse(fs.readFileSync(path.join(process.cwd(), file.replace(/\.html$/, '.toc.json')), 'utf8'))
  return { html, toc }
}
