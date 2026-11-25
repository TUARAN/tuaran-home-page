import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { ADMIN_NAV_GROUPS } from '../../lib/admin/adminRoutes.js'

function collectIcons(items, out = []) {
  for (const item of items || []) {
    if (item.icon) out.push({ icon: item.icon, label: item.label, href: item.href })
    collectIcons(item.items, out)
    for (const section of item.sections || []) collectIcons(section.items, out)
  }
  return out
}

const entries = ADMIN_NAV_GROUPS.flatMap((group) => collectIcons(group.items))
const iconSource = await readFile(new URL('../../lib/admin/adminIcons.jsx', import.meta.url), 'utf8')
const iconMap = Object.fromEntries(
  [...iconSource.matchAll(/^\s+([A-Za-z]+): (Icon[A-Za-z0-9]+),$/gm)].map(([, key, component]) => [key, component]),
)

test('admin menu entries never share an icon key', () => {
  const seen = new Map()
  for (const entry of entries) {
    const prev = seen.get(entry.icon)
    assert.ok(!prev, `icon "${entry.icon}" used by both ${prev?.label} and ${entry.label}`)
    seen.set(entry.icon, entry)
  }
})

test('every admin menu icon key maps to a distinct Tabler component', () => {
  const seen = new Map()
  for (const entry of entries) {
    const component = iconMap[entry.icon]
    assert.ok(component, `icon "${entry.icon}" (${entry.label}) is not registered in adminIcons.jsx`)
    const prev = seen.get(component)
    assert.ok(!prev, `${component} rendered for both ${prev} and ${entry.label}`)
    seen.set(component, entry.label)
  }
})

test('站点记忆 sits right after 站点架构', () => {
  const hrefs = entries.map((entry) => entry.href)
  const architecture = hrefs.indexOf('/admin/cloudflare-personal-site-map')
  assert.equal(hrefs[architecture + 1], '/admin/context-memory')
})
