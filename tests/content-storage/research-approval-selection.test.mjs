import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyVisibleSelection,
  pruneSelectedPaths,
  summarizeBatchPublish,
  toggleSelectedPath,
  visibleSelectionState,
} from '../../app/(admin)/admin/articles/research-import/researchApprovalSelection.js'

test('checkbox selection can toggle one path, select the visible list, and drop published paths', () => {
  const one = toggleSelectedPath(new Set(), 'a.md')
  assert.deepEqual([...one], ['a.md'])
  assert.deepEqual([...toggleSelectedPath(one, 'a.md')], [])

  const selected = applyVisibleSelection(new Set(['hidden.md']), ['a.md', 'b.md'], true)
  assert.deepEqual([...selected].sort(), ['a.md', 'b.md', 'hidden.md'])
  assert.deepEqual([...applyVisibleSelection(selected, ['a.md', 'b.md'], false)].sort(), ['hidden.md'])

  const pruned = pruneSelectedPaths(new Set(['a.md', 'gone.md']), ['a.md', 'b.md'])
  assert.deepEqual([...pruned], ['a.md'])
  const untouched = new Set(['a.md'])
  assert.equal(pruneSelectedPaths(untouched, ['a.md', 'b.md']), untouched)
})

test('visible selection reports all, some, and selected counts separately', () => {
  assert.deepEqual(visibleSelectionState(new Set(['a.md', 'b.md']), ['a.md', 'b.md']), {
    all: true,
    some: false,
    selectedCount: 2,
    visibleCount: 2,
  })
  assert.deepEqual(visibleSelectionState(new Set(['a.md', 'hidden.md']), ['a.md', 'b.md']), {
    all: false,
    some: true,
    selectedCount: 2,
    visibleCount: 1,
  })
  assert.deepEqual(visibleSelectionState(new Set(), ['a.md']), {
    all: false,
    some: false,
    selectedCount: 0,
    visibleCount: 0,
  })
})

test('batch publish summary keeps successes and names remaining failures', () => {
  assert.deepEqual(summarizeBatchPublish([{ ok: true, label: '甲' }, { ok: true, label: '乙' }]), {
    tone: 'success',
    text: '已发布 2 篇。',
  })
  assert.deepEqual(summarizeBatchPublish([{ ok: false, label: '甲', error: '冲突' }]), {
    tone: 'danger',
    text: '发布失败 1 篇：甲（冲突）',
  })
  assert.deepEqual(
    summarizeBatchPublish([
      { ok: true, label: '甲' },
      { ok: false, label: '乙', error: '超时' },
    ]),
    {
      tone: 'warning',
      text: '已发布 1 篇，失败 1 篇：乙（超时）',
    },
  )
})
