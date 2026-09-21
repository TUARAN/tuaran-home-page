import assert from 'node:assert/strict'
import test from 'node:test'
import { articleSourceCountLabel } from '../lib/articleSourceCountLabel.mjs'

test('omits zero-count sources from article count labels', () => {
  assert.equal(articleSourceCountLabel(0, 70), '掘金 70')
  assert.equal(articleSourceCountLabel(5, 0), '站内 5')
  assert.equal(articleSourceCountLabel(5, 70), '站内 5 + 掘金 70')
  assert.equal(articleSourceCountLabel(0, 0), '暂无内容')
})
