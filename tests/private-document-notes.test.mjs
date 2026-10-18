import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePrivateNote, rowToPrivateNote } from '../lib/private-data/privateDocumentNotes.js'

test('private text note preserves diary paragraphs and rejects empty or oversized content', () => {
  const body = '第一段。\n\n第二段。'
  assert.deepEqual(normalizePrivateNote({ title: '  一篇日记  ', body }), { title: '一篇日记', body })
  assert.equal(normalizePrivateNote({ title: '', body }).error, 'TITLE_REQUIRED')
  assert.equal(normalizePrivateNote({ title: '一篇日记', body: '' }).error, 'BODY_REQUIRED')
  assert.equal(normalizePrivateNote({ title: '一篇日记', body: 'x'.repeat(50001) }).error, 'BODY_REQUIRED')
  assert.deepEqual(rowToPrivateNote({ id: 'a', title: '一篇日记', body, revision: 2, created_at: 1, updated_at: 2 }), {
    id: 'a', title: '一篇日记', body, revision: 2, createdAt: 1, updatedAt: 2,
  })
})
