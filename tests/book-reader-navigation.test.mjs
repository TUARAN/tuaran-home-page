import assert from 'node:assert/strict'
import test from 'node:test'
import { pickBookSection } from '../app/(site)/components/book-reader/navigation.mjs'

test('book toc follows document position and ignores hidden sections', () => {
  assert.equal(pickBookSection([
    { id: 'later', top: 420 },
    { id: 'frequency', top: 108 },
    { id: 'hidden', top: NaN },
    { id: 'earlier', top: -300 },
  ]), 'frequency')
  assert.equal(pickBookSection([{ id: 'first', top: 300 }, { id: 'second', top: 600 }]), 'first')
  assert.equal(pickBookSection([{ id: 'hidden', top: NaN }]), '')
})
