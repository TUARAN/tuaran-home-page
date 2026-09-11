import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function loadDesignDocuments() {
  const source = await readFile(new URL('../../app/(admin)/admin/design/designDocuments.js', import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const pageSource = await readFile(new URL('../../app/(admin)/admin/design/page.jsx', import.meta.url), 'utf8')
const collapsibleSource = await readFile(new URL('../../app/(admin)/components/ui/CollapsibleSection.jsx', import.meta.url), 'utf8')
const auditSource = await readFile(new URL('../../ai-context/ui-ux-audit-roadmap.md', import.meta.url), 'utf8')

test('audit documents collapse by kind and later checklists can reuse the same flag', async () => {
  const { isCollapsedDesignDocument } = await loadDesignDocuments()
  assert.equal(isCollapsedDesignDocument({ kind: 'audit' }), true)
  assert.equal(isCollapsedDesignDocument({ kind: 'spec' }), false)
  assert.equal(isCollapsedDesignDocument({ title: '站点设计语言' }), false)
  assert.match(pageSource, /kind: 'audit'/)
  assert.match(pageSource, /isCollapsedDesignDocument\(document\)/)
  assert.match(pageSource, /<CollapsibleSection/)
  assert.doesNotMatch(pageSource, /kind: 'audit'[\s\S]*defaultOpen=\{true\}/)
})

test('UI audit checklist progress is counted from markdown checkboxes', async () => {
  const { countAuditTasks } = await loadDesignDocuments()
  assert.deepEqual(countAuditTasks(auditSource), { completed: 0, total: 10 })
  assert.deepEqual(
    countAuditTasks('- [x] UI-01：done\n- [ ] UI-02：todo\n- [X] SEO-03：also'),
    { completed: 2, total: 3 },
  )
  assert.deepEqual(countAuditTasks(''), { completed: 0, total: 0 })
})

test('collapsible section stays closed unless a matching hash targets it', () => {
  assert.match(collapsibleSource, /'use client'/)
  assert.doesNotMatch(collapsibleSource, /\sopen=\{/)
  assert.match(collapsibleSource, /window\.location\.hash === target/)
  assert.match(collapsibleSource, /hashchange/)
  assert.match(collapsibleSource, /openFromSamePageLink/)
  assert.match(collapsibleSource, /展开/)
})
