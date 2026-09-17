import assert from 'node:assert/strict'
import test from 'node:test'

import {
  editCountFromRevision,
  ownerAuthorValue,
  parseResearchGitEditCounts,
  resolveEditCount,
} from '../../lib/contentEditCount.js'

test('first published revision is not an edit, later revisions count from the second write', () => {
  assert.equal(editCountFromRevision(undefined), 0)
  assert.equal(editCountFromRevision(0), 0)
  assert.equal(editCountFromRevision(1), 0)
  assert.equal(editCountFromRevision('1'), 0)
  assert.equal(editCountFromRevision(2), 1)
  assert.equal(editCountFromRevision('4'), 3)
  assert.equal(editCountFromRevision(1.5), 0)
})

test('git name-only logs count each later commit as one edit', () => {
  const counts = parseResearchGitEditCounts(`
research/people/2026-06-05-dangnian-mingyue.md
research/people/2026-06-05-dangnian-mingyue.md
research/topics/2026-05-22-qwen3-6-qwen3-7-ecosystem.md
README.md
research/templates/a-share-company-research.md
`)
  assert.equal(counts['people/dangnian-mingyue'], 2)
  assert.equal(counts['topics/qwen3-6-qwen3-7-ecosystem'], 1)
  assert.equal(counts['templates/a-share-company-research'], undefined)
})

test('owner author line records the higher of publication revisions and git edits, and stays quiet when never modified', () => {
  assert.equal(resolveEditCount({}), 0)
  assert.equal(resolveEditCount({ revision: 1, editCount: 0 }), 0)
  assert.equal(resolveEditCount({ revision: 1, editCount: 4 }), 4)
  assert.equal(resolveEditCount({ revision: 5, editCount: 2 }), 4)
  assert.equal(ownerAuthorValue('TUARAN'), 'TUARAN')
  assert.equal(ownerAuthorValue('TUARAN', 1), 'TUARAN')
  assert.equal(ownerAuthorValue('TUARAN', 1, 4), 'TUARAN · 修改过4次')
  assert.equal(ownerAuthorValue('TUARAN', 5, 2), 'TUARAN · 修改过4次')
})
