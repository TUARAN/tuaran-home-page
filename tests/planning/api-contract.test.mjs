import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routeSource = await readFile(new URL('../../app/api/admin/planning/route.js', import.meta.url), 'utf8')
const importSource = await readFile(new URL('../../app/api/admin/planning/import/route.js', import.meta.url), 'utf8')

test('planning route declares the protected read and mutation API contract', () => {
  for (const source of [routeSource, importSource]) {
    assert.match(source, /getOwnerOrReject/)
    assert.match(source, /export const runtime = 'edge'/)
    assert.match(source, /export const dynamic = 'force-dynamic'/)
    assert.match(source, /DB_UNAVAILABLE/)
  }

  assert.match(routeSource, /INVALID_WINDOW/)
  assert.match(routeSource, /'create-direction': createDirection/)
  assert.match(routeSource, /'upsert-project-profile': upsertProjectProfile/)
  assert.match(routeSource, /'create-milestone': createMilestone/)
  assert.match(routeSource, /'create-task': createTask/)
  assert.match(routeSource, /'create-decision': createDecision/)
  assert.match(routeSource, /'create-event': createManualEvent/)
  assert.match(routeSource, /'create-dependency': createDependency/)
  assert.match(routeSource, /CONCLUSION_REQUIRED/)
  assert.match(routeSource, /status\s*===\s*'decided'/)
  assert.match(routeSource, /MILESTONE_HAS_OPEN_TASKS/)
  assert.match(routeSource, /ENTITY_REFERENCED/)
  assert.match(routeSource, /deletePristinePlanningEntity/)
})

test('planning import route rebuilds preview from live catalog and requires confirmation', () => {
  assert.match(importSource, /readPortfolioCatalog/)
  assert.match(importSource, /CHANGELOG/)
  assert.match(importSource, /previewInitialImport/)
  assert.match(importSource, /applyInitialImport/)
  assert.match(importSource, /IMPORT_CONFIRMATION_REQUIRED/)
  assert.match(importSource, /body\?\.confirm\s*!==\s*true/)
  assert.match(importSource, /inserted/)
  assert.match(importSource, /skipped/)
})
