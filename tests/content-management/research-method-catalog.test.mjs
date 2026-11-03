import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getResearchMethod, listResearchMethodItems } from '../../lib/research/researchMethodCatalog.js'

const root = new URL('../../', import.meta.url)

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  assert.ok(match, 'template is missing frontmatter')
  const data = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return data
}

test('research methods stay in the admin catalog and out of public article directories', async () => {
  const ids = listResearchMethodItems().map((item) => item.id)
  assert.deepEqual(ids, ['rules', 'styles', 'person', 'company', 'a-share', 'crypto'])

  const personTemplate = await readFile(new URL('research/templates/person-research.md', root), 'utf8')
  const aShareTemplate = await readFile(new URL('research/templates/a-share-company-research.md', root), 'utf8')
  const cryptoTemplate = await readFile(new URL('research/templates/crypto-asset-research.md', root), 'utf8')
  const person = getResearchMethod('person')
  const aShare = getResearchMethod('a-share')
  const crypto = getResearchMethod('crypto')

  assert.equal(frontmatter(personTemplate).template_version, person.version)
  assert.equal(frontmatter(personTemplate).template_updated, person.updated)
  assert.equal(frontmatter(aShareTemplate).template_version, aShare.version)
  assert.equal(frontmatter(aShareTemplate).template_updated, aShare.updated)
  assert.equal(frontmatter(cryptoTemplate).template_version, crypto.version)
  assert.equal(frontmatter(cryptoTemplate).template_updated, crypto.updated)

  const fenced = personTemplate.match(/```text\n([\s\S]*?)\n```/)
  assert.ok(fenced, 'person template is missing the name-only prompt')
  assert.equal(person.prompt, fenced[1])
  assert.match(person.prompt, /输入只有一个名字/)

  for (const section of aShare.sections) assert.match(aShareTemplate, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  for (const section of crypto.sections) assert.match(cryptoTemplate, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  await assert.rejects(readFile(new URL('research/topics/2026-11-03-person-research-method.md', root), 'utf8'))
  await assert.rejects(readFile(new URL('research/people/2026-11-03-person-research-method.md', root), 'utf8'))
})

test('research methods page embeds writing rules and styles behind the content nav entry', async () => {
  const page = await readFile(new URL('app/(admin)/admin/research-methods/page.jsx', root), 'utf8')
  const consoleSource = await readFile(new URL('app/(admin)/admin/research-methods/ResearchMethodsConsole.jsx', root), 'utf8')
  const routes = await readFile(new URL('lib/admin/adminRoutes.js', root), 'utf8')

  assert.match(page, /AdminPageGate/)
  assert.match(consoleSource, /ResearchStyleClient embedded view=\{selected\.view\}/)
  assert.match(routes, /label: '审批调研'[\s\S]*label: '调研方法'/)
  assert.match(routes, /href: '\/admin\/research-methods'/)
})
