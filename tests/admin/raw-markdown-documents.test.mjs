import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'

const require = createRequire(import.meta.url)
const config = require('../../next.config.js')

function buildWebpackConfig() {
  const webpackConfig = {
    watchOptions: { ignored: /\.(git|next)/ },
    resolve: { alias: {} },
    module: { rules: [] },
    plugins: [],
    experiments: {},
  }
  config.webpack(webpackConfig, {
    isServer: true,
    nextRuntime: 'nodejs',
    defaultLoaders: { babel: { loader: 'babel-loader' } },
  })
  return webpackConfig
}

function findMarkdownRules(rules) {
  return rules.filter((rule) => rule && Array.isArray(rule.oneOf) && rule.oneOf.some((branch) =>
    Array.isArray(branch?.use) && branch.use.some((entry) =>
      entry && typeof entry.loader === 'string' && entry.loader.includes('nextra'),
    ),
  ))
}

test('markdown ?raw imports skip the Nextra MDX loader', () => {
  const { rules } = buildWebpackConfig().module
  const markdownRules = findMarkdownRules(rules)
  assert.ok(markdownRules.length > 0, 'Nextra markdown rule must be present')
  for (const rule of markdownRules) {
    assert.ok(rule.resourceQuery?.not instanceof RegExp, 'Nextra rule must exclude a query')
    assert.equal(rule.resourceQuery.not.test('?raw'), true)
    assert.equal(rule.resourceQuery.not.test(''), false)
    assert.equal(rule.resourceQuery.not.test('?lang=en'), false)
  }
})

test('asset/source rule still handles markdown ?raw imports', () => {
  const { rules } = buildWebpackConfig().module
  const rawRule = rules.find((rule) => rule?.type === 'asset/source')
  assert.ok(rawRule, 'asset/source rule must be present')
  assert.equal(String(rawRule.resourceQuery), '/^\\?raw$/')
  assert.ok(rawRule.test.test('ui-ux-audit-roadmap.md'))
  assert.equal(rawRule.test.test('notes.md'), false)
})

test('all admin ?raw markdown documents are in the asset/source whitelist', () => {
  const { rules } = buildWebpackConfig().module
  const rawRule = rules.find((rule) => rule?.type === 'asset/source')
  const importedDocuments = [
    'ui-ux-audit-roadmap.md',
    'site-design-language.md',
    'loading-motion-system.md',
    'resource-book-reader.md',
    'branch-management.md',
    'seo-geo-growth-roadmap.md',
    'site-health-audit.md',
    'cloudflare-usage-incidents.md',
  ]
  for (const document of importedDocuments) {
    assert.equal(rawRule.test.test(path.join('docs', document)), true, document)
  }
})
