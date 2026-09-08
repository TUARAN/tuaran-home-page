import assert from 'node:assert/strict'
import test from 'node:test'

import { selectHomeOpinionPosts } from '../lib/homeOpinionSignals.js'

test('homepage prioritizes distinct opinions while preserving order within each group', () => {
  const posts = [
    { id: 'neutral-new', stance: 'neutral', url: 'https://example.com/neutral-new' },
    { id: 'oppose-new', stance: 'oppose', url: 'https://example.com/oppose-new' },
    { id: 'support', stance: 'support', url: 'https://example.com/support' },
    { id: 'neutral-old', stance: 'neutral', url: 'https://example.com/neutral-old' },
    { id: 'question', stance: 'question', url: 'https://example.com/question' },
  ]

  assert.deepEqual(
    selectHomeOpinionPosts(posts).map((post) => post.id),
    ['oppose-new', 'support', 'question', 'neutral-new', 'neutral-old'],
  )
})

test('homepage excludes invalid links, treats unknown stances as neutral, and applies the limit', () => {
  const posts = [
    { id: 'unknown', stance: 'mixed', url: 'https://example.com/unknown' },
    { id: 'invalid', stance: 'oppose', url: '/local-link' },
    { id: 'support', stance: 'support', url: 'http://example.com/support' },
    { id: 'neutral', stance: 'neutral', url: 'https://example.com/neutral' },
  ]

  assert.deepEqual(
    selectHomeOpinionPosts(posts, 2).map((post) => post.id),
    ['support', 'unknown'],
  )
  assert.deepEqual(selectHomeOpinionPosts(null), [])
  assert.deepEqual(selectHomeOpinionPosts(posts, 0), [])
})
